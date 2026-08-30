import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseISO, startOfDay, endOfDay } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, startDate, endDate, quantity = 1, reason = "MAINTENANCE", note } = body;

    if (!productId || !startDate || !endDate || !quantity) {
      return NextResponse.json(
        { error: "Lütfen ürün, başlangıç/bitiş tarihi ve adet bilgilerini eksiksiz girin." },
        { status: 400 }
      );
    }

    const block = await prisma.availabilityBlock.create({
      data: {
        productId,
        startDate: startOfDay(parseISO(startDate)),
        endDate: endOfDay(parseISO(endDate)),
        quantity: parseInt(quantity, 10),
        reason,
        note,
      },
    });

    return NextResponse.json({ success: true, block }, { status: 201 });
  } catch (error: any) {
    console.error("Create Block Error:", error);
    return NextResponse.json(
      { error: error.message || "Stok blokajı oluşturulurken hata oluştu." },
      { status: 500 }
    );
  }
}
