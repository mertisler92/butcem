import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const isSupplier = searchParams.get("isSupplier") === "true";

    if (id) {
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          supplierProfile: true,
          products: {
            where: { isActive: true },
            include: { images: true, category: true },
          },
          receivedReviews: {
            include: { reviewerCompany: true },
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!company) {
        return NextResponse.json({ error: "Şirket bulunamadı." }, { status: 404 });
      }

      return NextResponse.json(company);
    }

    const whereClause: any = {};
    if (isSupplier) {
      whereClause.supplierProfile = { isNot: null };
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
      include: {
        supplierProfile: true,
        _count: {
          select: { products: true, tenantOrders: true, supplierOrders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(companies);
  } catch (error: any) {
    console.error("Get Companies Error:", error);
    return NextResponse.json(
      { error: error.message || "Şirketler listelenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      taxNumber,
      taxOffice,
      address,
      city,
      website,
      companyType,
      contactName,
      email,
      phone,
      isSupplier = false,
      supplierDescription,
    } = body;

    if (!name || !taxNumber || !taxOffice || !address || !city || !email) {
      return NextResponse.json(
        { error: "Lütfen zorunlu şirket bilgilerini eksiksiz doldurun." },
        { status: 400 }
      );
    }

    // Check existing
    const existing = await prisma.company.findUnique({
      where: { taxNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu vergi numarası ile kayıtlı bir şirket zaten mevcut." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create user if not existing
      let user = await tx.user.findUnique({ where: { email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            name: contactName || name,
            passwordHash: "demo123456",
            phone,
            role: "USER",
          },
        });
      }

      // Create Company
      const company = await tx.company.create({
        data: {
          name,
          taxNumber,
          taxOffice,
          address,
          city,
          website,
          companyType: companyType || "Limited Şirket",
          email,
          phone,
          status: "IN_REVIEW", // In review by admin
        },
      });

      // Member association
      await tx.companyMember.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "OWNER",
        },
      });

      // If supplier
      if (isSupplier) {
        await tx.supplierProfile.create({
          data: {
            companyId: company.id,
            description: supplierDescription || `${name} profesyonel kiralama tedarikçisi.`,
            isVerified: false,
            serviceCities: city,
          },
        });
      }

      return company;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Create Company Error:", error);
    return NextResponse.json(
      { error: error.message || "Şirket kaydı oluşturulurken hata oluştu." },
      { status: 500 }
    );
  }
}
