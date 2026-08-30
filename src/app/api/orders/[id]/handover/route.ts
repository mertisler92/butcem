import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProtocolType } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const {
      type = "DELIVERY",
      deliveredQuantity,
      photos = [],
      notes,
      signedByName,
    } = body;

    if (!signedByName || deliveredQuantity === undefined) {
      return NextResponse.json(
        { error: "Lütfen teslim alan/teslim eden yetkili adını ve adet bilgisini girin." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    const protocol = await prisma.handoverProtocol.create({
      data: {
        orderId,
        type: type as ProtocolType,
        deliveredQuantity: parseInt(deliveredQuantity, 10),
        photosJson: JSON.stringify(photos),
        notes,
        signedByName,
        signedAt: new Date(),
      },
    });

    // Auto progress order status if appropriate
    if (type === "DELIVERY" && order.status === "PREPARING") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
      });
    } else if (type === "RETURN" && (order.status === "ACTIVE" || order.status === "RETURN_PENDING")) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "RETURNED" },
      });
    }

    return NextResponse.json({ success: true, protocol }, { status: 201 });
  } catch (error: any) {
    console.error("Handover Protocol Error:", error);
    return NextResponse.json(
      { error: error.message || "Tutanak kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
