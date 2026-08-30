import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { solveRFQMultiSupplier } from "@/lib/rfq/solver";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rfq = await prisma.rfq.findUnique({
      where: { id },
      include: {
        tenantCompany: true,
        items: {
          include: { category: true },
        },
        quotes: {
          include: {
            supplierCompany: {
              include: { supplierProfile: true },
            },
            items: {
              include: { product: true },
            },
          },
          orderBy: { grandTotal: "asc" },
        },
      },
    });

    if (!rfq) {
      return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
    }

    // Run multi-supplier matching solutions for each RFQ item
    const itemSolutions = await Promise.all(
      rfq.items.map(async (item) => {
        const solutions = await solveRFQMultiSupplier({
          categorySlug: item.category?.slug,
          keyword: item.productName,
          city: rfq.city,
          startDate: rfq.startDate,
          endDate: rfq.endDate,
          requestedQuantity: item.quantity,
        });

        return {
          itemId: item.id,
          productName: item.productName,
          requestedQuantity: item.quantity,
          solutions,
        };
      })
    );

    return NextResponse.json({
      rfq,
      itemSolutions,
    });
  } catch (error: any) {
    console.error("Get RFQ Detail Error:", error);
    return NextResponse.json(
      { error: error.message || "Talep detayları alınırken hata oluştu." },
      { status: 500 }
    );
  }
}
