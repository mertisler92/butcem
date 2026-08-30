import { PrismaClient } from "@prisma/client";
import { getProductAvailability, reserveInventoryAtomic, releaseOrderInventory } from "../src/lib/inventory/availability";
import { solveRFQMultiSupplier } from "../src/lib/rfq/solver";
import { calculateRentalPricing } from "../src/lib/pricing/calculator";
import { parseNaturalLanguageRFQ } from "../src/lib/ai/nlp-parser";
import { PaymentService } from "../src/lib/payments/service";
import { parseISO, addDays, format } from "date-fns";

const prisma = new PrismaClient();

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runAllTests() {
  console.log("=========================================================");
  console.log("🚀 STARTING KIRALAPRO B2B AUTOMATED TEST SUITE");
  console.log("=========================================================\n");

  let passedCount = 0;
  let totalTests = 0;

  // TEST 1: Pricing & Volume Discounts
  try {
    totalTests++;
    console.log("👉 TEST 1: Pricing Engine & Volume Discounts");
    const mockProduct = {
      dailyPrice: 50.0,
      weeklyPrice: 240.0,
      monthlyPrice: 700.0,
      purchasePriceEstimate: 500.0,
      depositType: "PERCENTAGE" as const,
      depositPercent: 10.0,
      vatRate: 20.0,
      deliveryFee: 500.0,
      setupFee: 200.0,
      volumeDiscounts: [
        { minQuantity: 100, maxQuantity: 499, discountPercent: 10.0 },
        { minQuantity: 500, discountPercent: 15.0 },
      ],
    };

    // 1-day rental of 100 units
    const pricing1Day = calculateRentalPricing(mockProduct, "2026-10-10", "2026-10-11", 100, true, true);
    assert(pricing1Day.rentalDays === 1, "Calculated 1 day rental");
    assert(pricing1Day.volumeDiscountPercent === 10, "10% volume discount applied for 100 units");
    assert(pricing1Day.discountedSubtotal === 4500, "Subtotal: 100 * 50 * 0.90 = 4500 TL");
    assert(pricing1Day.estimatedPurchaseCost === 50000, "Purchase cost estimated at 50,000 TL");
    assert(pricing1Day.estimatedSavings !== null && pricing1Day.estimatedSavings > 0, "Calculates positive savings vs buying");

    // 7-day rental (weekly pricing optimization check)
    const pricing7Days = calculateRentalPricing(mockProduct, "2026-10-10", "2026-10-17", 1, false, false);
    assert(pricing7Days.rentalDays === 7, "Calculated 7 days rental");
    assert(pricing7Days.effectiveRateType === "WEEKLY", "Weekly rate automatically preferred over 7 * daily rate");
    assert(pricing7Days.appliedUnitRate === 240, "Applied 240 TL weekly rate instead of 350 TL daily sum");

    console.log("✅ TEST 1 PASSED\n");
    passedCount++;
  } catch (err: any) {
    console.error("❌ TEST 1 FAILED:", err);
  }

  // TEST 2: AI Natural Language RFQ Parser
  try {
    totalTests++;
    console.log("👉 TEST 2: Natural Language Turkish RFQ Parser");
    const rawInput = "18-20 Kasım İstanbul Fuar Merkezi'nde etkinliğimiz var. 1.000 sandalye, 100 masa ve 20 televizyon lazım.";
    const parsed = await parseNaturalLanguageRFQ(rawInput);

    assert(parsed.city === "İstanbul", "Extracted city: İstanbul");
    assert(parsed.address?.includes("İstanbul Fuar Merkezi") || false, "Extracted venue: İstanbul Fuar Merkezi");
    assert(parsed.startDate.includes("-11-18"), "Extracted start date in November (18 Kasım)");
    assert(parsed.endDate.includes("-11-20"), "Extracted end date in November (20 Kasım)");
    assert(parsed.items.length >= 3, `Extracted ${parsed.items.length} items`);

    const chairItem = parsed.items.find((i) => i.productName.toLowerCase().includes("sandalye"));
    assert(chairItem !== undefined && chairItem.quantity === 1000, "Extracted 1000 Sandalye");

    const tableItem = parsed.items.find((i) => i.productName.toLowerCase().includes("masa"));
    assert(tableItem !== undefined && tableItem.quantity === 100, "Extracted 100 Masa");

    const tvItem = parsed.items.find((i) => i.productName.toLowerCase().includes("televizyon") || i.productName.toLowerCase().includes("tv"));
    assert(tvItem !== undefined && tvItem.quantity === 20, "Extracted 20 Televizyon");

    console.log("✅ TEST 2 PASSED\n");
    passedCount++;
  } catch (err: any) {
    console.error("❌ TEST 2 FAILED:", err);
  }

  // TEST 3: Multi-Supplier Solver Algorithm
  try {
    totalTests++;
    console.log("👉 TEST 3: Multi-Supplier RFQ Solver Algorithm");

    const solution = await solveRFQMultiSupplier({
      keyword: "sandalye",
      city: "İstanbul",
      startDate: "2026-10-10",
      endDate: "2026-10-12",
      requestedQuantity: 1000,
    });

    assert(solution.totalAvailableAcrossAllSuppliers >= 1000, `Found ${solution.totalAvailableAcrossAllSuppliers} total available chairs across suppliers in Istanbul`);
    assert(solution.multiSupplierSolution !== null, "Multi-supplier combined solution generated");
    assert(solution.multiSupplierSolution?.isCompleteFulfillment === true, "Multi-supplier solution fulfills 100% (1,000 units)");
    assert(solution.multiSupplierSolution?.allocations.length !== undefined && solution.multiSupplierSolution.allocations.length >= 2, `Combined ${solution.multiSupplierSolution?.allocations.length} supplier allocations to fulfill 1,000 units`);

    const totalOfferedQty = solution.multiSupplierSolution!.allocations.reduce((sum, a) => sum + a.offeredQuantity, 0);
    assert(totalOfferedQty === 1000, `Total allocated quantity equals requested 1,000 (Allocated: ${totalOfferedQty})`);

    console.log("✅ TEST 3 PASSED\n");
    passedCount++;
  } catch (err: any) {
    console.error("❌ TEST 3 FAILED:", err);
  }

  // TEST 4: E2E Business Workflow & Overbooking Prevention Scenario (Section 34)
  try {
    totalTests++;
    console.log("👉 TEST 4: Comprehensive E2E Scenario (ABC Organizasyon / 1.000 Sandalye / 10-12 Ekim / Lock & Lifecycle)");

    // Step A: Fetch Tenant & Suppliers
    const tenant = await prisma.company.findFirst({ where: { name: { contains: "ABC Organizasyon" } } });
    const supplierA = await prisma.company.findFirst({ where: { name: { contains: "Mega Event" } } });
    const supplierB = await prisma.company.findFirst({ where: { name: { contains: "Pro Kiralama" } } });

    assert(tenant !== null, "Tenant 'ABC Organizasyon' found in database");
    assert(supplierA !== null, "Supplier A 'Mega Event' found in database");
    assert(supplierB !== null, "Supplier B 'Pro Kiralama' found in database");

    const productA = await prisma.product.findFirst({ where: { supplierCompanyId: supplierA!.id, name: { contains: "Sandalye" } } });
    const productB = await prisma.product.findFirst({ where: { supplierCompanyId: supplierB!.id, name: { contains: "Sandalye" } } });

    assert(productA !== null && productA.totalStock === 600, "Supplier A product has 600 units initial stock");
    assert(productB !== null && productB.totalStock === 800, "Supplier B product has 800 units initial stock");

    const startDate = "2026-10-10";
    const endDate = "2026-10-12";

    // Step B: Check initial availability before booking
    const availAInitial = await getProductAvailability(productA!.id, startDate, endDate, 600);
    const availBInitial = await getProductAvailability(productB!.id, startDate, endDate, 400);

    assert(availAInitial.availableQuantity === 600, "Supplier A has 600 available initially on 10-12 Oct");
    assert(availBInitial.availableQuantity === 800, "Supplier B has 800 available initially on 10-12 Oct");

    // Step C: Create and Confirm Multi-Supplier Booking (Supplier A: 600, Supplier B: 400)
    const testOrderIdA = `TEST-ORD-A-${Date.now()}`;
    const testOrderIdB = `TEST-ORD-B-${Date.now()}`;

    // Transaction A for Supplier A
    await prisma.$transaction(async (tx) => {
      await reserveInventoryAtomic(tx, {
        productId: productA!.id,
        orderId: testOrderIdA,
        startDate,
        endDate,
        quantity: 600,
        reason: "RESERVED",
        note: "ABC Organizasyon E2E Test Kiralama",
      });
    });

    // Transaction B for Supplier B
    await prisma.$transaction(async (tx) => {
      await reserveInventoryAtomic(tx, {
        productId: productB!.id,
        orderId: testOrderIdB,
        startDate,
        endDate,
        quantity: 400,
        reason: "RESERVED",
        note: "ABC Organizasyon E2E Test Kiralama",
      });
    });

    console.log("  ✓ Reserved 600 chairs from Supplier A and 400 chairs from Supplier B on 10-12 Oct");

    // Step D: Verify Stock After Booking for the same dates (10-12 Oct)
    const availAPostBooking = await getProductAvailability(productA!.id, startDate, endDate, 1);
    const availBPostBooking = await getProductAvailability(productB!.id, startDate, endDate, 1);

    assert(availAPostBooking.availableQuantity === 0, "Supplier A available stock is now 0 on 10-12 Oct");
    assert(availBPostBooking.availableQuantity === 400, "Supplier B available stock is now 400 (800 - 400) on 10-12 Oct");

    // Step E: Attempting to book 1,000 chairs again on 10-12 Oct should fail / report insufficient inventory
    const multiCheck = await solveRFQMultiSupplier({
      keyword: "sandalye",
      city: "İstanbul",
      startDate,
      endDate,
      requestedQuantity: 1000,
    });

    assert(
      multiCheck.multiSupplierSolution?.isCompleteFulfillment === false,
      "Second request for 1,000 chairs on 10-12 Oct correctly reports INSUFFICIENT stock (isCompleteFulfillment = false)"
    );

    // Step F: Querying for non-overlapping future dates (e.g. 15-17 Oct) should show 100% available stock again!
    const availAFuture = await getProductAvailability(productA!.id, "2026-10-15", "2026-10-17", 600);
    const availBFuture = await getProductAvailability(productB!.id, "2026-10-15", "2026-10-17", 800);

    assert(availAFuture.availableQuantity === 600, "Supplier A has 600 available again on 15-17 Oct (Re-rentability verified)");
    assert(availBFuture.availableQuantity === 800, "Supplier B has 800 available again on 15-17 Oct (Re-rentability verified)");

    // Step G: Clean up test reservations
    await releaseOrderInventory(prisma, testOrderIdA);
    await releaseOrderInventory(prisma, testOrderIdB);

    const availACleaned = await getProductAvailability(productA!.id, startDate, endDate, 600);
    assert(availACleaned.availableQuantity === 600, "Inventory cleanly released after order completion/release");

    console.log("✅ TEST 4 PASSED\n");
    passedCount++;
  } catch (err: any) {
    console.error("❌ TEST 4 FAILED:", err);
  }

  console.log("=========================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passedCount}/${totalTests} TESTS PASSED`);
  console.log("=========================================================\n");

  if (passedCount === totalTests) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("⚠️ SOME TESTS FAILED!");
    process.exit(1);
  }
}

runAllTests().finally(async () => {
  await prisma.$disconnect();
});
