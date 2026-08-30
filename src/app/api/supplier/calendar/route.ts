import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierCompanyId = searchParams.get("supplierCompanyId");
    const month = searchParams.get("month") || new Date().toISOString();

    if (!supplierCompanyId) {
      return NextResponse.json({ error: "Tedarikçi şirket ID gereklidir." }, { status: 400 });
    }

    const targetDate = typeof month === "string" ? parseISO(month) : month;
    const startMonth = startOfMonth(targetDate);
    const endMonth = endOfMonth(targetDate);

    const products = await prisma.product.findMany({
      where: {
        supplierCompanyId,
        isActive: true,
      },
      include: {
        availabilityBlocks: {
          where: {
            startDate: { lte: endMonth },
            endDate: { gte: startMonth },
          },
          orderBy: { startDate: "asc" },
        },
        orderItems: {
          where: {
            order: {
              startDate: { lte: endMonth },
              endDate: { gte: startMonth },
              status: { notIn: ["CANCELLED", "COMPLETED"] },
            },
          },
          include: {
            order: {
              include: { tenantCompany: true },
            },
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Supplier Calendar Error:", error);
    return NextResponse.json(
      { error: error.message || "Takvim verisi alınırken hata oluştu." },
      { status: 500 }
    );
  }
}
