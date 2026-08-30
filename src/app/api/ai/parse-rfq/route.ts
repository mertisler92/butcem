import { NextRequest, NextResponse } from "next/server";
import { parseNaturalLanguageRFQ } from "@/lib/ai/nlp-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir talep metni girin." },
        { status: 400 }
      );
    }

    const result = await parseNaturalLanguageRFQ(prompt);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Parse RFQ Error:", error);
    return NextResponse.json(
      { error: error.message || "Talebiniz ayrıştırılırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
