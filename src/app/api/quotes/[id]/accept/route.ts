import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, getRentalDays } from "@/lib/utils";
import { PaymentService } from "@/lib/payments/service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const body = await req.json().catch(() => ({}));
    const { deliveryAddress, notes } = body;

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        rfq: {
          include: { tenantCompany: true },
        },
        supplierCompany: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
    }

    if (quote.status === "ACCEPTED") {
      return NextResponse.json({ error: "Bu teklif zaten kabul edilmiş." }, { status: 400 });
    }

    const days = getRentalDays(quote.rfq.startDate, quote.rfq.endDate);
    const financials = PaymentService.calculateOrderFinancials({
      productTotal: quote.productTotal - quote.discountTotal,
      deliveryFee: quote.deliveryFee,
      setupFee: quote.setupFee,
      depositAmount: quote.depositTotal,
      vatRate: 20.0,
      commissionRate: 10.0,
    });

    const orderNumber = generateOrderNumber();

    // Create Order in transaction and update quote status
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          tenantCompanyId: quote.rfq.tenantCompanyId,
          supplierCompanyId: quote.supplierCompanyId,
          quoteId: quote.id,
          rfqId: quote.rfqId,
          startDate: quote.rfq.startDate,
          endDate: quote.rfq.endDate,
          status: "PAYMENT_PENDING",
          deliveryOption: "SUPPLIER_DELIVERS",
          deliveryAddress: deliveryAddress || quote.rfq.address || `${quote.rfq.city} Teslimat Adresi`,
          deliveryCity: quote.rfq.city,
          deliveryFee: financials.deliveryFee,
          setupFee: financials.setupFee,
          productTotal: financials.productTotal,
          depositTotal: financials.depositAmount,
          vatTotal: financials.vatAmount,
          platformCommissionRate: financials.commissionRate,
          platformCommissionFee: financials.commissionAmount,
          supplierPayout: financials.supplierPayout,
          grandTotal: financials.grandTotal,
          notes: notes || quote.notes,
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId!,
              quantity: item.offeredQuantity,
              unitDailyPrice: item.unitDailyPrice,
              rentalDays: days,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Update quote status
      await tx.quote.update({
        where: { id: quote.id },
        data: { status: "ACCEPTED" },
      });

      // Update RFQ status
      await tx.rfq.update({
        where: { id: quote.rfqId },
        data: { status: "ACCEPTED" },
      });

      // Create initial deposit record
      if (financials.depositAmount > 0) {
        await tx.deposit.create({
          data: {
            orderId: createdOrder.id,
            amount: financials.depositAmount,
            status: "HELD",
          },
        });
      }

      return createdOrder;
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Accept Quote Error:", error);
    return NextResponse.json(
      { error: error.message || "Teklif kabul edilirken hata oluştu." },
      { status: 500 }
    );
  }
}
