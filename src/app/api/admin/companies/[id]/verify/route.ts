import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CompanyStatus } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await req.json();
    const { status, isVerifiedSupplier } = body;

    if (!status) {
      return NextResponse.json({ error: "Şirket durumu belirtilmedi." }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.company.update({
        where: { id: companyId },
        data: { status: status as CompanyStatus },
      });

      if (isVerifiedSupplier !== undefined) {
        await tx.supplierProfile.updateMany({
          where: { companyId },
          data: { isVerified: Boolean(isVerifiedSupplier) },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "COMPANY_VERIFICATION_UPDATED",
          entity: "Company",
          entityId: companyId,
          detailsJson: JSON.stringify({ newStatus: status, isVerifiedSupplier }),
        },
      });

      return comp;
    });

    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    console.error("Verify Company Error:", error);
    return NextResponse.json(
      { error: error.message || "Şirket durumu güncellenirken hata oluştu." },
      { status: 500 }
    );
  }
}
