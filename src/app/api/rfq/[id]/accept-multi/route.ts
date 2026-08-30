import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, getRentalDays } from "@/lib/utils";
import { PaymentService } from "@/lib/payments/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rfqId } = await params;
    const body = await req.json();
    const { allocations, deliveryAddress, notes } = body;

    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { error: "Geçerli bir çoklu tedarikçi tahsisatı bulunamadı." },
        { status: 400 }
      );
    }

    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId },
    });

    if (!rfq) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }

    const days = getRentalDays(rfq.startDate, rfq.endDate);

    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = [];

      for (const alloc of allocations) {
        const productTotal = alloc.offeredQuantity * alloc.unitDailyPrice * days;
        const financials = PaymentService.calculateOrderFinancials({
          productTotal,
          deliveryFee: alloc.deliveryFee || 0,
          setupFee: alloc.setupFee || 0,
          depositAmount: productTotal * 0.10, // 10% default deposit
          vatRate: 20.0,
          commissionRate: 10.0,
        });

        const orderNumber = generateOrderNumber();

        const ord = await tx.order.create({
          data: {
            orderNumber,
            tenantCompanyId: rfq.tenantCompanyId,
            supplierCompanyId: alloc.supplierCompanyId,
            rfqId: rfq.id,
            startDate: rfq.startDate,
            endDate: rfq.endDate,
            status: "PAYMENT_PENDING",
            deliveryOption: "SUPPLIER_DELIVERS",
            deliveryAddress: deliveryAddress || rfq.address || `${rfq.city} Teslimat Adresi`,
            deliveryCity: rfq.city,
            deliveryFee: financials.deliveryFee,
            setupFee: financials.setupFee,
            productTotal: financials.productTotal,
            depositTotal: financials.depositAmount,
            vatTotal: financials.vatAmount,
            platformCommissionRate: financials.commissionRate,
            platformCommissionFee: financials.commissionAmount,
            supplierPayout: financials.supplierPayout,
            grandTotal: financials.grandTotal,
            notes: notes || `Çoklu tedarikçi çözümü (${alloc.offeredQuantity} adet)`,
            items: {
              create: [
                {
                  productId: alloc.productId,
                  quantity: alloc.offeredQuantity,
                  unitDailyPrice: alloc.unitDailyPrice,
                  rentalDays: days,
                  lineTotal: productTotal,
                },
              ],
            },
          },
        });

        if (financials.depositAmount > 0) {
          await tx.deposit.create({
            data: {
              orderId: ord.id,
              amount: financials.depositAmount,
              status: "HELD",
            },
          });
        }

        orders.push(ord);
      }

      // Update RFQ status
      await tx.rfq.update({
        where: { id: rfqId },
        data: { status: "ACCEPTED" },
      });

      return orders;
    });

    return NextResponse.json({ success: true, orders: createdOrders });
  } catch (error: any) {
    console.error("Accept Multi-Supplier Solution Error:", error);
    return NextResponse.json(
      { error: error.message || "Çoklu tedarikçi siparişi oluşturulurken hata oluştu." },
      { status: 500 }
    );
  }
}
