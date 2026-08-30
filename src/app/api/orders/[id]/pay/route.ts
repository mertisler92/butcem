import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentService } from "@/lib/payments/service";
import { reserveInventoryAtomic } from "@/lib/inventory/availability";
import { PaymentProvider } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json().catch(() => ({}));
    const { provider = "SANDBOX", cardDetails } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    if (order.status !== "PAYMENT_PENDING" && order.status !== "REQUESTED" && order.status !== "QUOTE_ACCEPTED") {
      return NextResponse.json(
        { error: `Bu siparişin mevcut durumu (${order.status}) ödeme yapmaya uygun değildir.` },
        { status: 400 }
      );
    }

    // 1. Process payment through payment service abstraction
    const paymentResult = await PaymentService.processPayment({
      orderId: order.id,
      amount: order.grandTotal,
      provider: provider as PaymentProvider,
      cardDetails,
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.message || "Ödeme işlemi başarısız oldu." },
        { status: 400 }
      );
    }

    // 2. Perform atomic inventory reservation and update order status inside a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Reserve inventory for each item
      for (const item of order.items) {
        await reserveInventoryAtomic(tx, {
          productId: item.productId,
          orderId: order.id,
          startDate: order.startDate,
          endDate: order.endDate,
          quantity: item.quantity,
          reason: "RESERVED",
          note: `Sipariş: ${order.orderNumber}`,
        });
      }

      // Record payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.grandTotal,
          status: "PAID",
          provider: provider as PaymentProvider,
          transactionId: paymentResult.transactionId,
          notes: paymentResult.message,
          paidAt: new Date(),
        },
      });

      // Update order status to CONFIRMED
      const confirmedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
        },
        include: {
          items: {
            include: { product: true },
          },
          payments: true,
        },
      });

      return confirmedOrder;
    });

    return NextResponse.json({
      success: true,
      message: "Ödeme başarıyla alındı ve stok rezervasyonu kesinleşti.",
      order: updatedOrder,
      transactionId: paymentResult.transactionId,
    });
  } catch (error: any) {
    console.error("Order Payment Error:", error);
    return NextResponse.json(
      { error: error.message || "Ödeme ve rezervasyon işlemi sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
