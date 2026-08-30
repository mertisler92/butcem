import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, getRentalDays } from "@/lib/utils";
import { PaymentService } from "@/lib/payments/service";
import { calculateRentalPricing } from "@/lib/pricing/calculator";
import { parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantCompanyId = searchParams.get("tenantCompanyId");
    const supplierCompanyId = searchParams.get("supplierCompanyId");
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (tenantCompanyId) whereClause.tenantCompanyId = tenantCompanyId;
    if (supplierCompanyId) whereClause.supplierCompanyId = supplierCompanyId;
    if (status) whereClause.status = status;

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        tenantCompany: true,
        supplierCompany: {
          include: { supplierProfile: true },
        },
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
        payments: true,
        depositRecord: true,
        protocols: true,
        damageClaims: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Get Orders Error:", error);
    return NextResponse.json(
      { error: error.message || "Siparişler listelenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      tenantCompanyId,
      startDate,
      endDate,
      quantity = 1,
      deliveryOption = "SUPPLIER_DELIVERS",
      deliveryAddress,
      deliveryCity,
      includeSetup = false,
      notes,
    } = body;

    if (!productId || !tenantCompanyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Lütfen ürün, kiracı şirket ve tarih bilgilerini eksiksiz girin." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { supplierCompany: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }

    const pricing = calculateRentalPricing(
      product,
      startDate,
      endDate,
      quantity,
      deliveryOption === "SUPPLIER_DELIVERS",
      includeSetup
    );

    const financials = PaymentService.calculateOrderFinancials({
      productTotal: pricing.discountedSubtotal,
      deliveryFee: pricing.deliveryFee,
      setupFee: pricing.setupFee,
      depositAmount: pricing.depositAmount,
      vatRate: pricing.vatRate,
      commissionRate: 10.0,
    });

    const orderNumber = generateOrderNumber();

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        tenantCompanyId,
        supplierCompanyId: product.supplierCompanyId,
        startDate: parseISO(startDate),
        endDate: parseISO(endDate),
        status: "PAYMENT_PENDING",
        deliveryOption,
        deliveryAddress: deliveryAddress || `${deliveryCity || product.city} Teslimat Adresi`,
        deliveryCity: deliveryCity || product.city,
        deliveryFee: financials.deliveryFee,
        setupFee: financials.setupFee,
        productTotal: financials.productTotal,
        depositTotal: financials.depositAmount,
        vatTotal: financials.vatAmount,
        platformCommissionRate: financials.commissionRate,
        platformCommissionFee: financials.commissionAmount,
        supplierPayout: financials.supplierPayout,
        grandTotal: financials.grandTotal,
        notes,
        items: {
          create: [
            {
              productId: product.id,
              quantity,
              unitDailyPrice: product.dailyPrice,
              rentalDays: pricing.rentalDays,
              lineTotal: pricing.discountedSubtotal,
            },
          ],
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (financials.depositAmount > 0) {
      await prisma.deposit.create({
        data: {
          orderId: newOrder.id,
          amount: financials.depositAmount,
          status: "HELD",
        },
      });
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error("Create Direct Order Error:", error);
    return NextResponse.json(
      { error: error.message || "Sipariş oluşturulurken hata oluştu." },
      { status: 500 }
    );
  }
}
