import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalCompanies = await prisma.company.count();
    const verifiedCompanies = await prisma.company.count({ where: { status: "VERIFIED" } });
    const pendingCompanies = await prisma.company.count({ where: { status: "IN_REVIEW" } });
    const totalProducts = await prisma.product.count({ where: { isActive: true } });
    const totalRFQs = await prisma.rfq.count();
    const totalQuotes = await prisma.quote.count();
    const totalOrders = await prisma.order.count();
    const activeOrders = await prisma.order.count({
      where: {
        status: { in: ["CONFIRMED", "PREPARING", "DELIVERED", "ACTIVE", "RETURN_PENDING"] },
      },
    });

    const orders = await prisma.order.findMany({
      where: {
        status: { notIn: ["CANCELLED", "REQUESTED", "PAYMENT_PENDING"] },
      },
      select: {
        grandTotal: true,
        platformCommissionFee: true,
      },
    });

    const gmv = orders.reduce((sum, o) => sum + o.grandTotal, 0);
    const platformRevenue = orders.reduce((sum, o) => sum + o.platformCommissionFee, 0);
    const avgOrderValue = orders.length > 0 ? gmv / orders.length : 0;
    const quoteToOrderConversion = totalQuotes > 0 ? ((totalOrders / totalQuotes) * 100).toFixed(1) : "0";

    const openDamageClaims = await prisma.damageClaim.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    });

    return NextResponse.json({
      gmv,
      platformRevenue,
      totalOrders,
      activeOrders,
      avgOrderValue,
      quoteToOrderConversion: `${quoteToOrderConversion}%`,
      totalCompanies,
      verifiedCompanies,
      pendingCompanies,
      totalProducts,
      totalRFQs,
      totalQuotes,
      openDamageClaims,
    });
  } catch (error: any) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json(
      { error: error.message || "Admin istatistikleri alınırken hata oluştu." },
      { status: 500 }
    );
  }
}
