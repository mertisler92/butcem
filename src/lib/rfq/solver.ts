import { prisma } from "@/lib/prisma";
import { getProductAvailability } from "@/lib/inventory/availability";
import { calculateRentalPricing } from "@/lib/pricing/calculator";
import { MultiSupplierSolution, SupplierAllocation } from "@/types";

export interface RFQSolverParams {
  categorySlug?: string;
  keyword?: string;
  city: string;
  startDate: Date | string;
  endDate: Date | string;
  requestedQuantity: number;
}

export async function solveRFQMultiSupplier(params: RFQSolverParams): Promise<{
  singleSupplierOptions: MultiSupplierSolution[];
  multiSupplierSolution: MultiSupplierSolution | null;
  totalAvailableAcrossAllSuppliers: number;
}> {
  const { categorySlug, keyword, city, startDate, endDate, requestedQuantity } = params;

  // Search candidate products
  const candidateProducts = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(city ? { city: { equals: city } } : {}),
      ...(categorySlug
        ? {
            category: {
              slug: { equals: categorySlug },
            },
          }
        : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword } },
              { description: { contains: keyword } },
            ],
          }
        : {}),
    },
    include: {
      supplierCompany: {
        include: {
          supplierProfile: true,
        },
      },
      category: true,
      volumeDiscounts: true,
    },
    orderBy: {
      dailyPrice: "asc",
    },
  });

  // Calculate live available stock for each candidate product
  const availableCandidates: Array<{
    product: (typeof candidateProducts)[0];
    availableStock: number;
  }> = [];

  let totalAvailableAcrossAllSuppliers = 0;

  for (const prod of candidateProducts) {
    const avail = await getProductAvailability(prod.id, startDate, endDate, 1);
    if (avail.availableQuantity > 0) {
      availableCandidates.push({
        product: prod,
        availableStock: avail.availableQuantity,
      });
      totalAvailableAcrossAllSuppliers += avail.availableQuantity;
    }
  }

  // 1. Find Single Supplier Options (suppliers with availableStock >= requestedQuantity)
  const singleSupplierOptions: MultiSupplierSolution[] = [];

  for (const item of availableCandidates) {
    if (item.availableStock >= requestedQuantity) {
      const pricing = calculateRentalPricing(
        item.product,
        startDate,
        endDate,
        requestedQuantity,
        true,
        false
      );

      const allocation: SupplierAllocation = {
        supplierCompanyId: item.product.supplierCompanyId,
        supplierName: item.product.supplierCompany.name,
        productId: item.product.id,
        productName: item.product.name,
        offeredQuantity: requestedQuantity,
        unitDailyPrice: item.product.dailyPrice,
        deliveryFee: item.product.deliveryFee,
        setupFee: item.product.setupFee,
        subtotal: pricing.discountedSubtotal,
        totalDays: pricing.rentalDays,
        lineTotal: pricing.grandTotal,
      };

      singleSupplierOptions.push({
        type: "SINGLE_SUPPLIER",
        suppliersCount: 1,
        isCompleteFulfillment: true,
        fulfilledQuantity: requestedQuantity,
        requestedQuantity,
        allocations: [allocation],
        totalProductPrice: pricing.discountedSubtotal,
        totalDeliveryFee: item.product.deliveryFee,
        totalSetupFee: item.product.setupFee,
        estimatedTotal: pricing.grandTotal,
      });
    }
  }

  // 2. Compute Multi-Supplier Combined Solution
  let multiSupplierSolution: MultiSupplierSolution | null = null;

  // Sort available candidates by unit price ascending for cost efficiency
  const sortedCandidates = [...availableCandidates].sort(
    (a, b) => a.product.dailyPrice - b.product.dailyPrice
  );

  let remainingNeeded = requestedQuantity;
  const allocations: SupplierAllocation[] = [];
  let combinedProductPrice = 0;
  let combinedDeliveryFee = 0;
  let combinedSetupFee = 0;
  let combinedGrandTotal = 0;

  for (const candidate of sortedCandidates) {
    if (remainingNeeded <= 0) break;

    const allocQty = Math.min(remainingNeeded, candidate.availableStock);
    if (allocQty > 0) {
      const pricing = calculateRentalPricing(
        candidate.product,
        startDate,
        endDate,
        allocQty,
        true,
        false
      );

      allocations.push({
        supplierCompanyId: candidate.product.supplierCompanyId,
        supplierName: candidate.product.supplierCompany.name,
        productId: candidate.product.id,
        productName: candidate.product.name,
        offeredQuantity: allocQty,
        unitDailyPrice: candidate.product.dailyPrice,
        deliveryFee: candidate.product.deliveryFee,
        setupFee: candidate.product.setupFee,
        subtotal: pricing.discountedSubtotal,
        totalDays: pricing.rentalDays,
        lineTotal: pricing.grandTotal,
      });

      combinedProductPrice += pricing.discountedSubtotal;
      combinedDeliveryFee += candidate.product.deliveryFee;
      combinedSetupFee += candidate.product.setupFee;
      combinedGrandTotal += pricing.grandTotal;

      remainingNeeded -= allocQty;
    }
  }

  if (allocations.length > 0) {
    const fulfilledQuantity = requestedQuantity - remainingNeeded;
    multiSupplierSolution = {
      type: allocations.length > 1 ? "MULTI_SUPPLIER" : "SINGLE_SUPPLIER",
      suppliersCount: allocations.length,
      isCompleteFulfillment: remainingNeeded === 0,
      fulfilledQuantity,
      requestedQuantity,
      allocations,
      totalProductPrice: combinedProductPrice,
      totalDeliveryFee: combinedDeliveryFee,
      totalSetupFee: combinedSetupFee,
      estimatedTotal: combinedGrandTotal,
    };
  }

  return {
    singleSupplierOptions,
    multiSupplierSolution,
    totalAvailableAcrossAllSuppliers,
  };
}
