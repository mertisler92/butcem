import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const rfqId = searchParams.get("rfqId");

    if (!orderId && !rfqId) {
      return NextResponse.json({ error: "orderId veya rfqId parametresi gereklidir." }, { status: 400 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        ...(orderId ? { orderId } : {}),
        ...(rfqId ? { rfqId } : {}),
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { senderUser: true },
        },
      },
    });

    return NextResponse.json(conversation ? conversation.messages : []);
  } catch (error: any) {
    console.error("Get Messages Error:", error);
    return NextResponse.json(
      { error: error.message || "Mesajlar alınırken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, rfqId, senderUserId, senderName, content } = body;

    if (!senderUserId || !content) {
      return NextResponse.json({ error: "Kullanıcı ID ve mesaj içeriği zorunludur." }, { status: 400 });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        ...(orderId ? { orderId } : {}),
        ...(rfqId ? { rfqId } : {}),
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          orderId: orderId || null,
          rfqId: rfqId || null,
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderUserId,
        senderName: senderName || "Kullanıcı",
        content,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error("Send Message Error:", error);
    return NextResponse.json(
      { error: error.message || "Mesaj gönderilirken hata oluştu." },
      { status: 500 }
    );
  }
}
