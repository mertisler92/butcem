import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        tenantCompany: true,
        supplierCompany: {
          include: { supplierProfile: true },
        },
        items: {
          include: {
            product: {
              include: { images: true, category: true },
            },
          },
        },
        payments: { orderBy: { createdAt: "desc" } },
        depositRecord: true,
        protocols: { orderBy: { createdAt: "asc" } },
        damageClaims: { orderBy: { createdAt: "desc" } },
        reviews: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Get Order Detail Error:", error);
    return NextResponse.json(
      { error: error.message || "Sipariş detayları alınırken hata oluştu." },
      { status: 500 }
    );
  }
}
