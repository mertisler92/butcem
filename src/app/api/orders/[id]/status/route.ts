import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseOrderInventory } from "@/lib/inventory/availability";
import { canTransitionOrder } from "@/lib/orders/state-machine";
import { OrderStatus } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const { nextStatus, notes } = body;

    if (!nextStatus) {
      return NextResponse.json({ error: "Hedef statü belirtilmedi." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        depositRecord: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    const isValidTransition = canTransitionOrder(order.status as OrderStatus, nextStatus as OrderStatus);
    if (!isValidTransition) {
      return NextResponse.json(
        { error: `${order.status} durumundan ${nextStatus} durumuna geçiş yapılamaz.` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If order is cancelled, release inventory blocks and mark deposit
      if (nextStatus === "CANCELLED") {
        await releaseOrderInventory(tx, order.id);
        if (order.depositRecord) {
          await tx.deposit.update({
            where: { id: order.depositRecord.id },
            data: { status: "RELEASED", releasedAt: new Date(), notes: "Sipariş iptali nedeniyle iade edildi." },
          });
        }
      }

      // If order is completed, release deposit if not already deducted
      if (nextStatus === "COMPLETED") {
        if (order.depositRecord && order.depositRecord.status === "HELD") {
          await tx.deposit.update({
            where: { id: order.depositRecord.id },
            data: { status: "RELEASED", releasedAt: new Date(), notes: "Kiralama eksiksiz tamamlandı." },
          });
        }
      }

      return await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          notes: notes ? `${order.notes ? order.notes + " | " : ""}${notes}` : order.notes,
        },
      });
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("Update Order Status Error:", error);
    return NextResponse.json(
      { error: error.message || "Sipariş durumu güncellenirken hata oluştu." },
      { status: 500 }
    );
  }
}
