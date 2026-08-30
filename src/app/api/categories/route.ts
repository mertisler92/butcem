import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Get Categories Error:", error);
    return NextResponse.json(
      { error: error.message || "Kategoriler listelenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, icon = "Box", description, commissionRate = 10.0, subCategories = [] } = body;

    if (!name) {
      return NextResponse.json({ error: "Kategori adı zorunludur." }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]/gi, "-");

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        icon,
        description,
        commissionRate: parseFloat(commissionRate),
        subCategories: {
          create: subCategories.map((sub: any, index: number) => ({
            name: sub.name,
            slug: sub.name.toLowerCase().replace(/[^a-z0-9]/gi, "-"),
            description: sub.description || null,
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        subCategories: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Create Category Error:", error);
    return NextResponse.json(
      { error: error.message || "Kategori eklenirken hata oluştu." },
      { status: 500 }
    );
  }
}
