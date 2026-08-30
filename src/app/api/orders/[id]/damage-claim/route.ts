import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const { description, claimedAmount, photos = [] } = body;

    if (!description || !claimedAmount) {
      return NextResponse.json(
        { error: "Lütfen hasar/eksik açıklamasını ve talep edilen tutarı girin." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    const claim = await prisma.$transaction(async (tx) => {
      const created = await tx.damageClaim.create({
        data: {
          orderId,
          description,
          claimedAmount: parseFloat(claimedAmount),
          photosJson: JSON.stringify(photos),
          status: "SUBMITTED",
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: "INSPECTING" },
      });

      return created;
    });

    return NextResponse.json({ success: true, claim }, { status: 201 });
  } catch (error: any) {
    console.error("Submit Damage Claim Error:", error);
    return NextResponse.json(
      { error: error.message || "Hasar talebi oluşturulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}
