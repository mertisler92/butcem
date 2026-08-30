import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReviewRole } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      reviewerCompanyId,
      revieweeCompanyId,
      role = "TENANT_TO_SUPPLIER",
      overallRating = 5,
      subRatings = {},
      comment,
    } = body;

    if (!orderId || !reviewerCompanyId || !revieweeCompanyId) {
      return NextResponse.json({ error: "Sipariş ve şirket bilgileri gereklidir." }, { status: 400 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          orderId,
          reviewerCompanyId,
          revieweeCompanyId,
          role: role as ReviewRole,
          overallRating: parseFloat(overallRating),
          subRatingsJson: JSON.stringify(subRatings),
          comment,
        },
      });

      // Update supplier average rating if reviewee has a supplier profile
      const supplierProfile = await tx.supplierProfile.findUnique({
        where: { companyId: revieweeCompanyId },
      });

      if (supplierProfile) {
        const allReviews = await tx.review.findMany({
          where: { revieweeCompanyId },
          select: { overallRating: true },
        });

        const newCount = allReviews.length;
        const avg = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / newCount;

        await tx.supplierProfile.update({
          where: { companyId: revieweeCompanyId },
          data: {
            rating: parseFloat(avg.toFixed(2)),
            reviewCount: newCount,
          },
        });
      }

      return created;
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("Create Review Error:", error);
    return NextResponse.json(
      { error: error.message || "Değerlendirme kaydedilirken hata oluştu." },
      { status: 500 }
    );
  }
}
