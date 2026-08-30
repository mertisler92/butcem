import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRFQNumber } from "@/lib/utils";
import { parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantCompanyId = searchParams.get("tenantCompanyId");
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (tenantCompanyId) {
      whereClause.tenantCompanyId = tenantCompanyId;
    }
    if (status) {
      whereClause.status = status;
    }

    const rfqs = await prisma.rfq.findMany({
      where: whereClause,
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
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rfqs);
  } catch (error: any) {
    console.error("Get RFQs Error:", error);
    return NextResponse.json(
      { error: error.message || "Talepler listelenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantCompanyId,
      title,
      rawPrompt,
      city,
      address,
      startDate,
      endDate,
      deliveryNeeded = true,
      setupNeeded = false,
      notes,
      items,
    } = body;

    if (!tenantCompanyId || !title || !city || !startDate || !endDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Lütfen zorunlu alanları (Şirket, Başlık, Şehir, Tarihler ve En az 1 Ekipman) eksiksiz doldurun." },
        { status: 400 }
      );
    }

    const rfqNumber = generateRFQNumber();

    const newRfq = await prisma.rfq.create({
      data: {
        rfqNumber,
        tenantCompanyId,
        title,
        rawPrompt,
        city,
        address,
        startDate: parseISO(startDate),
        endDate: parseISO(endDate),
        deliveryNeeded,
        setupNeeded,
        status: "OPEN",
        notes,
        items: {
          create: items.map((item: any) => ({
            productName: item.productName,
            quantity: parseInt(item.quantity, 10),
            categoryId: item.categoryId || null,
            targetBudget: item.targetBudget ? parseFloat(item.targetBudget) : null,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
        tenantCompany: true,
      },
    });

    return NextResponse.json(newRfq, { status: 201 });
  } catch (error: any) {
    console.error("Create RFQ Error:", error);
    return NextResponse.json(
      { error: error.message || "Kiralama talebi oluşturulurken hata oluştu." },
      { status: 500 }
    );
  }
}
