import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params;
    const body = await req.json();
    const { status, approvedAmount = 0, resolutionNotes, adminUserId } = body;

    const claim = await prisma.damageClaim.findUnique({
      where: { id: claimId },
      include: {
        order: {
          include: { depositRecord: true },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: "Hasar talebi bulunamadı." }, { status: 404 });
    }

    const resolvedClaim = await prisma.$transaction(async (tx) => {
      const parsedApproved = parseFloat(approvedAmount || 0);

      const updatedClaim = await tx.damageClaim.update({
        where: { id: claimId },
        data: {
          status: status || "RESOLVED",
          approvedAmount: parsedApproved,
          resolvedByAdminId: adminUserId || null,
          resolutionNotes,
        },
      });

      // Update deposit record
      if (claim.order.depositRecord) {
        if (parsedApproved > 0) {
          await tx.deposit.update({
            where: { id: claim.order.depositRecord.id },
            data: {
              status: "DEDUCTED_FOR_DAMAGE",
              deductionAmount: parsedApproved,
              releasedAt: new Date(),
              notes: `Hasar tazminatı kesintisi: ${parsedApproved} TL. Not: ${resolutionNotes || ""}`,
            },
          });
        } else {
          await tx.deposit.update({
            where: { id: claim.order.depositRecord.id },
            data: {
              status: "RELEASED",
              releasedAt: new Date(),
              notes: "Hasar talebi reddedildi, depozito iade edildi.",
            },
          });
        }
      }

      // Progress order to COMPLETED
      await tx.order.update({
        where: { id: claim.orderId },
        data: { status: "COMPLETED" },
      });

      return updatedClaim;
    });

    return NextResponse.json({ success: true, claim: resolvedClaim });
  } catch (error: any) {
    console.error("Resolve Damage Claim Error:", error);
    return NextResponse.json(
      { error: error.message || "Hasar uyuşmazlığı çözülürken hata oluştu." },
      { status: 500 }
    );
  }
}
