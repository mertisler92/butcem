import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductAvailability } from "@/lib/inventory/availability";
import { calculateRentalPricing } from "@/lib/pricing/calculator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const quantity = parseInt(searchParams.get("quantity") || "1", 10);
    const includeDelivery = searchParams.get("includeDelivery") !== "false";
    const includeSetup = searchParams.get("includeSetup") === "true";

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subCategory: true,
        images: { orderBy: { sortOrder: "asc" } },
        supplierCompany: {
          include: {
            supplierProfile: true,
            receivedReviews: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                reviewerCompany: true,
              },
            },
          },
        },
        volumeDiscounts: { orderBy: { minQuantity: "asc" } },
        availabilityBlocks: {
          where: {
            endDate: { gte: new Date() },
          },
          orderBy: { startDate: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }

    let availability = null;
    let pricing = null;

    if (startDate && endDate) {
      availability = await getProductAvailability(product.id, startDate, endDate, quantity);
      pricing = calculateRentalPricing(
        product,
        startDate,
        endDate,
        quantity,
        includeDelivery,
        includeSetup
      );
    }

    return NextResponse.json({
      product,
      availability,
      pricing,
    });
  } catch (error: any) {
    console.error("Get Product Detail Error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün detayları alınırken hata oluştu." },
      { status: 500 }
    );
  }
}
