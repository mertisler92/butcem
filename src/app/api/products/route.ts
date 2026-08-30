import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductAvailability } from "@/lib/inventory/availability";
import { calculateRentalPricing } from "@/lib/pricing/calculator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const categorySlug = searchParams.get("category") || "";
    const city = searchParams.get("city") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const quantity = parseInt(searchParams.get("quantity") || "1", 10);
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const sortBy = searchParams.get("sortBy") || "recommended";
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const deliveryOnly = searchParams.get("deliveryOnly") === "true";

    const whereClause: any = {
      isActive: true,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
        { brand: { contains: query } },
      ];
    }

    if (categorySlug) {
      whereClause.category = {
        slug: categorySlug,
      };
    }

    if (city && city !== "Tüm Şehirler") {
      whereClause.city = city;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.dailyPrice = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    if (deliveryOnly) {
      whereClause.deliveryOption = "SUPPLIER_DELIVERS";
    }

    if (verifiedOnly) {
      whereClause.supplierCompany = {
        supplierProfile: {
          isVerified: true,
        },
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        subCategory: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        supplierCompany: {
          include: {
            supplierProfile: true,
          },
        },
        volumeDiscounts: true,
      },
      orderBy:
        sortBy === "price_asc"
          ? { dailyPrice: "asc" }
          : sortBy === "price_desc"
          ? { dailyPrice: "desc" }
          : { featured: "desc" },
    });

    // If date range is provided, calculate exact availability
    const enrichedProducts = await Promise.all(
      products.map(async (prod) => {
        let availableStock = prod.totalStock;
        let isAvailableForDates = true;

        if (startDate && endDate) {
          try {
            const avail = await getProductAvailability(prod.id, startDate, endDate, quantity);
            availableStock = avail.availableQuantity;
            isAvailableForDates = avail.isAvailable;
          } catch (e) {
            console.error("Availability check error for product", prod.id, e);
          }
        }

        let pricingEstimate = null;
        if (startDate && endDate) {
          pricingEstimate = calculateRentalPricing(
            prod,
            startDate,
            endDate,
            quantity,
            true,
            false
          );
        }

        return {
          ...prod,
          calculatedAvailableStock: availableStock,
          isAvailableForDates,
          pricingEstimate,
        };
      })
    );

    // Filter by quantity availability if date range was selected
    let finalProducts = enrichedProducts;
    if (startDate && endDate && quantity > 1) {
      finalProducts = finalProducts.filter((p) => p.calculatedAvailableStock >= quantity);
    }

    return NextResponse.json({
      products: finalProducts,
      totalCount: finalProducts.length,
    });
  } catch (error: any) {
    console.error("Get Products API Error:", error);
    return NextResponse.json(
      { error: error.message || "Ürünler listelenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      supplierCompanyId,
      categoryId,
      subCategoryId,
      name,
      description,
      brand,
      model,
      totalStock,
      minRentalDays = 1,
      minQuantity = 1,
      dailyPrice,
      weeklyPrice,
      monthlyPrice,
      purchasePriceEstimate,
      depositType = "PERCENTAGE",
      depositAmount = 0,
      depositPercent = 10,
      vatRate = 20,
      city,
      address,
      deliveryOption = "SUPPLIER_DELIVERS",
      deliveryFee = 0,
      setupOption = "NONE",
      setupFee = 0,
      condition = "LIKE_NEW",
      imageUrl,
    } = body;

    if (!supplierCompanyId || !categoryId || !name || !dailyPrice || !city || !totalStock) {
      return NextResponse.json(
        { error: "Lütfen tüm zorunlu alanları doldurun." },
        { status: 400 }
      );
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/gi, "-")}-${Date.now().toString().slice(-4)}`;

    const newProduct = await prisma.product.create({
      data: {
        supplierCompanyId,
        categoryId,
        subCategoryId: subCategoryId || null,
        name,
        slug,
        description: description || name,
        brand,
        model,
        totalStock: parseInt(totalStock, 10),
        minRentalDays: parseInt(minRentalDays, 10),
        minQuantity: parseInt(minQuantity, 10),
        dailyPrice: parseFloat(dailyPrice),
        weeklyPrice: weeklyPrice ? parseFloat(weeklyPrice) : null,
        monthlyPrice: monthlyPrice ? parseFloat(monthlyPrice) : null,
        purchasePriceEstimate: purchasePriceEstimate ? parseFloat(purchasePriceEstimate) : null,
        depositType,
        depositAmount: parseFloat(depositAmount || 0),
        depositPercent: parseFloat(depositPercent || 0),
        vatRate: parseFloat(vatRate || 20),
        city,
        address,
        deliveryOption,
        deliveryFee: parseFloat(deliveryFee || 0),
        setupOption,
        setupFee: parseFloat(setupFee || 0),
        condition,
        isActive: true,
        images: {
          create: [
            {
              url: imageUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
              isPrimary: true,
              sortOrder: 1,
            },
          ],
        },
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("Create Product Error:", error);
    return NextResponse.json(
      { error: error.message || "Ürün eklenirken hata oluştu." },
      { status: 500 }
    );
  }
}
