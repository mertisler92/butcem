import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuoteNumber, getRentalDays } from "@/lib/utils";
import { addDays } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rfqId } = await params;
    const body = await req.json();
    const {
      supplierCompanyId,
      items,
      deliveryFee = 0,
      setupFee = 0,
      depositTotal = 0,
      vatTotal = 0,
      discountTotal = 0,
      validDays = 7,
      notes,
    } = body;

    if (!supplierCompanyId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Lütfen teklif detaylarını ve en az bir ürün satırını doldurun." },
        { status: 400 }
      );
    }

    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId },
    });

    if (!rfq) {
      return NextResponse.json({ error: "İlgili RFQ bulunamadı." }, { status: 404 });
    }

    const days = getRentalDays(rfq.startDate, rfq.endDate);
    let productTotal = 0;

    const formattedItems = items.map((it: any) => {
      const offeredQuantity = parseInt(it.offeredQuantity, 10);
      const unitDailyPrice = parseFloat(it.unitDailyPrice);
      const lineTotal = offeredQuantity * unitDailyPrice * days;
      productTotal += lineTotal;

      return {
        rfqItemId: it.rfqItemId || null,
        productId: it.productId || null,
        productName: it.productName,
        offeredQuantity,
        unitDailyPrice,
        totalDays: days,
        lineTotal,
      };
    });

    const parsedDelivery = parseFloat(deliveryFee || 0);
    const parsedSetup = parseFloat(setupFee || 0);
    const parsedDiscount = parseFloat(discountTotal || 0);
    const parsedDeposit = parseFloat(depositTotal || 0);

    const taxableBase = productTotal - parsedDiscount + parsedDelivery + parsedSetup;
    const computedVat = vatTotal ? parseFloat(vatTotal) : (taxableBase * 0.20);
    const grandTotal = taxableBase + computedVat + parsedDeposit;

    const quoteNumber = generateQuoteNumber();

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        rfqId,
        supplierCompanyId,
        status: "PENDING",
        productTotal,
        deliveryFee: parsedDelivery,
        setupFee: parsedSetup,
        depositTotal: parsedDeposit,
        vatTotal: computedVat,
        discountTotal: parsedDiscount,
        grandTotal,
        validUntil: addDays(new Date(), validDays),
        notes,
        items: {
          create: formattedItems,
        },
      },
      include: {
        items: true,
        supplierCompany: true,
      },
    });

    // Update RFQ status to QUOTED if still OPEN
    if (rfq.status === "OPEN") {
      await prisma.rfq.update({
        where: { id: rfqId },
        data: { status: "QUOTED" },
      });
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (error: any) {
    console.error("Submit Quote Error:", error);
    return NextResponse.json(
      { error: error.message || "Teklif iletilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
