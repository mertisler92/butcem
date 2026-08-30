import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding KiralaPro B2B Equipment Rental Database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.damageClaim.deleteMany();
  await prisma.handoverProtocol.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.rfqItem.deleteMany();
  await prisma.rfq.deleteMany();
  await prisma.availabilityBlock.deleteMany();
  await prisma.volumeDiscount.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplierProfile.deleteMany();
  await prisma.companyMember.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformSetting.deleteMany();

  // 1. Seed Platform Settings
  await prisma.platformSetting.createMany({
    data: [
      { key: "DEFAULT_COMMISSION_RATE", value: "10.0", description: "Varsayılan platform komisyon oranı (%)" },
      { key: "DEFAULT_VAT_RATE", value: "20.0", description: "Varsayılan KDV oranı (%)" },
      { key: "PLATFORM_CURRENCY", value: "TRY", description: "Platform para birimi" },
    ],
  });

  // 2. Seed Users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@kiralapro.com",
      name: "Sarp Yılmaz (Sistem Yöneticisi)",
      passwordHash: "demo123456",
      role: "ADMIN",
      phone: "+90 212 555 0000",
    },
  });

  const tenantUser = await prisma.user.create({
    data: {
      email: "info@abcorganizasyon.com",
      name: "Mert Demir (Satın Alma Müdürü)",
      passwordHash: "demo123456",
      role: "USER",
      phone: "+90 212 444 1122",
    },
  });

  const supplierAUser = await prisma.user.create({
    data: {
      email: "iletisim@megaevent.com",
      name: "Canan Çelik (Operasyon Direktörü)",
      passwordHash: "demo123456",
      role: "USER",
      phone: "+90 216 333 4455",
    },
  });

  const supplierBUser = await prisma.user.create({
    data: {
      email: "info@prokiralama.com",
      name: "Barış Kaya (Filo Yöneticisi)",
      passwordHash: "demo123456",
      role: "USER",
      phone: "+90 212 222 7788",
    },
  });

  const supplierCUser = await prisma.user.create({
    data: {
      email: "destek@fuartech.com",
      name: "Elif Arslan (B2B Satış Temsilcisi)",
      passwordHash: "demo123456",
      role: "USER",
      phone: "+90 212 888 9900",
    },
  });

  const supplierDUser = await prisma.user.create({
    data: {
      email: "satis@gastromutfak.com",
      name: "Kemal Öztürk (Genel Müdür)",
      passwordHash: "demo123456",
      role: "USER",
      phone: "+90 232 444 5566",
    },
  });

  // 3. Seed Companies
  const tenantCompany = await prisma.company.create({
    data: {
      name: "ABC Organizasyon ve Etkinlik Hizmetleri A.Ş.",
      taxNumber: "1234567890",
      taxOffice: "Beşiktaş Vergi Dairesi",
      address: "Levent Mah. Cömert Sok. No: 12/4 Beşiktaş",
      city: "İstanbul",
      website: "https://abcorganizasyon.com",
      companyType: "Anonim Şirket",
      status: "VERIFIED",
      phone: "+90 212 444 1122",
      email: "info@abcorganizasyon.com",
    },
  });

  const supplierACompany = await prisma.company.create({
    data: {
      name: "Mega Event Ekipmanları ve Çadır Ltd. Şti.",
      taxNumber: "9876543210",
      taxOffice: "Kadıköy Vergi Dairesi",
      address: "Bostancı Sanayi Sitesi A Blok No: 45 Kadıköy",
      city: "İstanbul",
      website: "https://megaevent.com",
      companyType: "Limited Şirket",
      status: "VERIFIED",
      phone: "+90 216 333 4455",
      email: "iletisim@megaevent.com",
    },
  });

  const supplierBCompany = await prisma.company.create({
    data: {
      name: "Pro Kiralama & Sahne Sistemleri A.Ş.",
      taxNumber: "4567891230",
      taxOffice: "Şişli Vergi Dairesi",
      address: "Mecidiyeköy Mah. Büyükdere Cad. No: 88 Şişli",
      city: "İstanbul",
      website: "https://prokiralama.com",
      companyType: "Anonim Şirket",
      status: "VERIFIED",
      phone: "+90 212 222 7788",
      email: "info@prokiralama.com",
    },
  });

  const supplierCCompany = await prisma.company.create({
    data: {
      name: "Fuar Tech Donanım & Görsel Sistemler Ltd.",
      taxNumber: "7891234560",
      taxOffice: "Bakırköy Vergi Dairesi",
      address: "Yeşilköy Mah. Atatürk Cad. İDTM Blokları Bakırköy",
      city: "İstanbul",
      website: "https://fuartech.com",
      companyType: "Limited Şirket",
      status: "VERIFIED",
      phone: "+90 212 888 9900",
      email: "destek@fuartech.com",
    },
  });

  const supplierDCompany = await prisma.company.create({
    data: {
      name: "Gastro Mutfak Endüstriyel Kiralama A.Ş.",
      taxNumber: "3216549870",
      taxOffice: "Konak Vergi Dairesi",
      address: "Alsancak Mah. Kıbrıs Şehitleri Cad. No: 15 Konak",
      city: "İzmir",
      website: "https://gastromutfak.com",
      companyType: "Anonim Şirket",
      status: "VERIFIED",
      phone: "+90 232 444 5566",
      email: "satis@gastromutfak.com",
    },
  });

  // 4. Company Memberships
  await prisma.companyMember.createMany({
    data: [
      { userId: tenantUser.id, companyId: tenantCompany.id, role: "OWNER" },
      { userId: supplierAUser.id, companyId: supplierACompany.id, role: "OWNER" },
      { userId: supplierBUser.id, companyId: supplierBCompany.id, role: "OWNER" },
      { userId: supplierCUser.id, companyId: supplierCCompany.id, role: "OWNER" },
      { userId: supplierDUser.id, companyId: supplierDCompany.id, role: "OWNER" },
    ],
  });

  // 5. Supplier Profiles
  await prisma.supplierProfile.createMany({
    data: [
      {
        companyId: supplierACompany.id,
        description: "15 yıllık sektör tecrübesiyle Türkiye'nin en büyük etkinlik sandalyesi, masa ve çadır kiralama filosu.",
        rating: 4.9,
        reviewCount: 84,
        completedRentals: 320,
        responseTimeMinutes: 15,
        isVerified: true,
        serviceCities: "İstanbul,Kocaeli,Bursa,Tekirdağ",
      },
      {
        companyId: supplierBCompany.id,
        description: "Kurumsal kongre, seminer ve fuarlar için profesyonel sahne, ışık, ses ve premium sandalye tedariği.",
        rating: 4.8,
        reviewCount: 62,
        completedRentals: 215,
        responseTimeMinutes: 20,
        isVerified: true,
        serviceCities: "İstanbul,Ankara,İzmir,Antalya",
      },
      {
        companyId: supplierCCompany.id,
        description: "Fuar standları ve iş etkinlikleri için 4K Smart TV, LED ekran, iPad, notebook ve sunum donanımları.",
        rating: 4.95,
        reviewCount: 110,
        completedRentals: 450,
        responseTimeMinutes: 10,
        isVerified: true,
        serviceCities: "İstanbul,Ankara,İzmir",
      },
      {
        companyId: supplierDCompany.id,
        description: "Endüstriyel mutfak makineleri, festival mutfakları, fritöz, ızgara ve soğutucu kiralama merkezi.",
        rating: 4.7,
        reviewCount: 41,
        completedRentals: 130,
        responseTimeMinutes: 35,
        isVerified: true,
        serviceCities: "İzmir,İstanbul,Manisa,Aydın",
      },
    ],
  });

  // 6. Categories & Subcategories
  const catEvent = await prisma.category.create({
    data: {
      name: "Etkinlik & Organizasyon",
      slug: "etkinlik-organizasyon",
      icon: "PartyPopper",
      description: "Düğün, festival, gala ve kurumsal etkinlik ekipmanları",
      commissionRate: 10.0,
      sortOrder: 1,
      subCategories: {
        create: [
          { name: "Sandalye", slug: "sandalye", sortOrder: 1 },
          { name: "Masa", slug: "masa", sortOrder: 2 },
          { name: "Bistro Masa", slug: "bistro-masa", sortOrder: 3 },
          { name: "Çadır & Gölgelik", slug: "cadir", sortOrder: 4 },
          { name: "Bariyer & Yönlendirme", slug: "bariyer", sortOrder: 5 },
          { name: "Sahne Ekipmanı", slug: "sahne-ekipmani", sortOrder: 6 },
          { name: "Aydınlatma", slug: "aydinlatma", sortOrder: 7 },
          { name: "Ses Sistemi", slug: "ses-sistemi", sortOrder: 8 },
        ],
      },
    },
  });

  const catExpo = await prisma.category.create({
    data: {
      name: "Fuar & Stand",
      slug: "fuar-stand",
      icon: "Tv",
      description: "Fuar standları, lansman ve sergi alanı ekipmanları",
      commissionRate: 12.0,
      sortOrder: 2,
      subCategories: {
        create: [
          { name: "TV & LED Ekran", slug: "tv-led-ekran", sortOrder: 1 },
          { name: "Monitör", slug: "monitor", sortOrder: 2 },
          { name: "Stand Mobilyası", slug: "stand-mobilyasi", sortOrder: 3 },
          { name: "Mini Buzdolabı & Bar", slug: "mini-buzdolabi", sortOrder: 4 },
          { name: "Kahve Makinesi", slug: "kahve-makinesi", sortOrder: 5 },
        ],
      },
    },
  });

  const catKitchen = await prisma.category.create({
    data: {
      name: "Endüstriyel Mutfak",
      slug: "endustriyel-mutfak",
      icon: "UtensilsCrossed",
      description: "Catering, pop-up restoran ve açık hava mutfak ekipmanları",
      commissionRate: 10.0,
      sortOrder: 3,
      subCategories: {
        create: [
          { name: "Fritöz", slug: "fritoz", sortOrder: 1 },
          { name: "Izgara", slug: "izgara", sortOrder: 2 },
          { name: "Ocak & Fırın", slug: "ocak-firin", sortOrder: 3 },
          { name: "Buzdolabı & Soğutucu", slug: "buzdolabi", sortOrder: 4 },
          { name: "Derin Dondurucu", slug: "derin-dondurucu", sortOrder: 5 },
          { name: "Hazırlık Ekipmanları", slug: "hazirlik-ekipmanlari", sortOrder: 6 },
        ],
      },
    },
  });

  const catTech = await prisma.category.create({
    data: {
      name: "Teknoloji",
      slug: "teknoloji",
      icon: "Laptop",
      description: "Kurumsal eğitim, sınav, geçici ofis ve toplantı bilişim donanımları",
      commissionRate: 8.0,
      sortOrder: 4,
      subCategories: {
        create: [
          { name: "Laptop & Notebook", slug: "laptop", sortOrder: 1 },
          { name: "Tablet & iPad", slug: "tablet", sortOrder: 2 },
          { name: "Projektör & Perde", slug: "projektor", sortOrder: 3 },
          { name: "Yazıcı & Fotokopi", slug: "yazici", sortOrder: 4 },
          { name: "POS Cihazı", slug: "pos-cihazi", sortOrder: 5 },
        ],
      },
    },
  });

  const catOffice = await prisma.category.create({
    data: {
      name: "Ofis",
      slug: "ofis",
      icon: "Briefcase",
      description: "Geçici proje ofisleri, şantiyeler ve toplantı odaları",
      commissionRate: 10.0,
      sortOrder: 5,
      subCategories: {
        create: [
          { name: "Ofis Masası", slug: "ofis-masasi", sortOrder: 1 },
          { name: "Ofis Sandalyesi", slug: "ofis-sandalyesi", sortOrder: 2 },
          { name: "Dolap & Keson", slug: "dolap-keson", sortOrder: 3 },
          { name: "Toplantı Ekipmanı", slug: "toplanti-ekipmani", sortOrder: 4 },
        ],
      },
    },
  });

  const catTechOps = await prisma.category.create({
    data: {
      name: "Teknik & Operasyon",
      slug: "teknik-operasyon",
      icon: "Zap",
      description: "Şantiye, açık alan enerjisi, iklimlendirme ve operasyon",
      commissionRate: 10.0,
      sortOrder: 6,
      subCategories: {
        create: [
          { name: "Jeneratör", slug: "jenerator", sortOrder: 1 },
          { name: "Aydınlatma Kulesi", slug: "aydinlatma-kulesi", sortOrder: 2 },
          { name: "Uzatma & Kablo Ekipmanı", slug: "kablo-ekipmani", sortOrder: 3 },
          { name: "Endüstriyel Fan & Isıtıcı", slug: "isitici-fan", sortOrder: 4 },
          { name: "Temizlik Ekipmanları", slug: "temizlik-ekipmanlari", sortOrder: 5 },
        ],
      },
    },
  });

  // 7. Seed Products with realistic inventory numbers
  // Product 1: Supplier A - 600 Chairs (Tiffany Beyaz)
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierACompany.id,
      categoryId: catEvent.id,
      name: "Tiffany Beyaz Ahşap Organizasyon Sandalyesi (Minderli)",
      slug: "tiffany-beyaz-ahsap-sandalye-mega",
      description: "Düğün, gala, kurumsal davet ve açık hava etkinlikleri için yüksek mukavemetli beyaz ahşap Tiffany sandalye. Deri minder dahildir.",
      brand: "MegaEvent Pro",
      model: "TF-2024",
      totalStock: 600, // Supplier A has 600 units
      minRentalDays: 1,
      minQuantity: 50,
      dailyPrice: 45.0,
      weeklyPrice: 220.0,
      monthlyPrice: 650.0,
      purchasePriceEstimate: 450.0, // Buying costs 450 TL/each
      depositType: "PERCENTAGE",
      depositPercent: 10.0,
      vatRate: 20.0,
      city: "İstanbul",
      address: "Bostancı Sanayi Sitesi A Blok No: 45 Kadıköy / İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 1500.0,
      setupOption: "OPTIONAL",
      setupFee: 1000.0,
      condition: "LIKE_NEW",
      isActive: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
      volumeDiscounts: {
        create: [
          { minQuantity: 100, maxQuantity: 299, discountPercent: 5.0 },
          { minQuantity: 300, maxQuantity: 499, discountPercent: 10.0 },
          { minQuantity: 500, discountPercent: 15.0 },
        ],
      },
    },
  });

  // Product 2: Supplier B - 800 Chairs (Premium Konferans / Seminer)
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierBCompany.id,
      categoryId: catEvent.id,
      name: "Ergonomik Konferans & Kongre Sandalyesi (Krom Ayaklı)",
      slug: "ergonomik-konferans-sandalyesi-pro",
      description: "Kongre, seminer ve kurumsal eğitimler için birbirine kilitlenebilir, ergonomik süngerli döşemeli konferans sandalyesi.",
      brand: "ProSit",
      model: "CONF-X1",
      totalStock: 800, // Supplier B has 800 units
      minRentalDays: 1,
      minQuantity: 50,
      dailyPrice: 50.0,
      weeklyPrice: 240.0,
      monthlyPrice: 700.0,
      purchasePriceEstimate: 520.0, // Buying costs 520 TL/each
      depositType: "PERCENTAGE",
      depositPercent: 10.0,
      vatRate: 20.0,
      city: "İstanbul",
      address: "Mecidiyeköy Mah. Şişli / İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 1800.0,
      setupOption: "OPTIONAL",
      setupFee: 1200.0,
      condition: "NEW",
      isActive: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
      volumeDiscounts: {
        create: [
          { minQuantity: 100, maxQuantity: 399, discountPercent: 5.0 },
          { minQuantity: 400, discountPercent: 12.0 },
        ],
      },
    },
  });

  // Product 3: Supplier A - 100 Extra Folding Chairs (Total chairs in platform = 1500)
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierACompany.id,
      categoryId: catEvent.id,
      name: "Katlanır Ahşap Bahçe & Festival Sandalyesi",
      slug: "katlanir-ahsap-festival-sandalyesi",
      description: "Festivaller ve açık hava organizasyonları için pratik katlanabilir ahşap sandalye.",
      brand: "NatureFold",
      model: "NF-100",
      totalStock: 100,
      minRentalDays: 1,
      minQuantity: 20,
      dailyPrice: 40.0,
      purchasePriceEstimate: 380.0,
      depositType: "PERCENTAGE",
      depositPercent: 10.0,
      city: "İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 1000.0,
      condition: "GOOD",
      isActive: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1580481077112-7023f064f2dc?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  // Product 4: 300 Tables across catalog
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierACompany.id,
      categoryId: catEvent.id,
      name: "Yuvarlak 10 Kişilik Banket Masası (180 cm)",
      slug: "yuvarlak-banket-masasi-180cm",
      description: "Katlanır metal ayaklı, 180 cm çapında 10-12 kişilik banket masası. Masa örtüsü opsiyoneldir.",
      brand: "EventTable Pro",
      totalStock: 150,
      dailyPrice: 180.0,
      weeklyPrice: 850.0,
      purchasePriceEstimate: 2400.0,
      depositType: "FIXED",
      depositAmount: 200.0,
      city: "İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 1200.0,
      setupFee: 600.0,
      condition: "LIKE_NEW",
      isActive: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      supplierCompanyId: supplierBCompany.id,
      categoryId: catEvent.id,
      name: "Kokteyl & Bistro Yüksek Bar Masası (Krom Ayaklı)",
      slug: "kokteyl-bistro-yuksek-bar-masasi",
      description: "Kokteyl ve fuar standları için 110 cm yükseklikte stretch giydirmeli bistro masa.",
      brand: "ProStand",
      totalStock: 150,
      dailyPrice: 95.0,
      weeklyPrice: 420.0,
      purchasePriceEstimate: 1200.0,
      depositType: "PERCENTAGE",
      depositPercent: 10.0,
      city: "İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 1000.0,
      condition: "NEW",
      isActive: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  // Product 5: 50 TVs & LED Screens
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierCCompany.id,
      categoryId: catExpo.id,
      name: "65\" Samsung 4K UHD Commercial Smart TV + Mobil Tekerlekli Stand",
      slug: "65-samsung-4k-uhd-smart-tv-standli",
      description: "Fuar standları ve ürün lansmanları için yüksek parlaklıklı 65 inç 4K Smart TV. Tekerlekli metal zemin standı ve HDMI kabloları dahildir.",
      brand: "Samsung",
      model: "LH65QBCEBGCXEN",
      totalStock: 50,
      minRentalDays: 1,
      dailyPrice: 1200.0,
      weeklyPrice: 4800.0,
      monthlyPrice: 12000.0,
      purchasePriceEstimate: 38000.0, // Buying costs 38.000 TL
      depositType: "FIXED",
      depositAmount: 3000.0,
      vatRate: 20.0,
      city: "İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 800.0,
      setupOption: "INCLUDED",
      setupFee: 0.0,
      condition: "NEW",
      isActive: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  // Product 6: 40 Industrial Fryers
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierDCompany.id,
      categoryId: catKitchen.id,
      name: "2x10 Lt Çift Havuzlu Sanayi Tipi Endüstriyel Fritöz (Elektrikli)",
      slug: "cift-havuzlu-sanayi-tipi-fritoz-20lt",
      description: "Yoğun mutfak operasyonları ve festival cateringleri için paslanmaz çelik 380V trifaze / 220V monifaze sanayi fritözü.",
      brand: "Öztiryakiler",
      model: "OFE 210",
      totalStock: 40,
      dailyPrice: 650.0,
      weeklyPrice: 2800.0,
      monthlyPrice: 7500.0,
      purchasePriceEstimate: 24500.0,
      depositType: "FIXED",
      depositAmount: 2500.0,
      city: "İzmir",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 600.0,
      condition: "LIKE_NEW",
      isActive: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  // Product 7: 20 Refrigerators / Mini Bars
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierCCompany.id,
      categoryId: catExpo.id,
      name: "Fuar Standı Tipi Cam Kapaklı Mini Bar Buzdolabı (50 Lt)",
      slug: "cam-kapakli-fuar-mini-bar-buzdolabi",
      description: "Fuar ve stand içi içecek ikramı için sessiz çalışan, iç aydınlatmalı cam kapaklı mini buzdolabı.",
      brand: "Uğur",
      model: "USS 60",
      totalStock: 20,
      dailyPrice: 350.0,
      weeklyPrice: 1400.0,
      monthlyPrice: 3500.0,
      purchasePriceEstimate: 11000.0,
      depositType: "FIXED",
      depositAmount: 1000.0,
      city: "İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 500.0,
      condition: "NEW",
      isActive: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  // Product 8: 100 Laptops
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierCCompany.id,
      categoryId: catTech.id,
      name: "Lenovo ThinkPad E16 Intel Core i7 16GB RAM 512GB SSD Laptop",
      slug: "lenovo-thinkpad-i7-16gb-kurumsal-laptop",
      description: "Kurumsal eğitimler, fuar kayıt masaları ve geçici ofisler için yüksek performanslı iş bilgisayarı.",
      brand: "Lenovo",
      model: "ThinkPad E16 Gen 1",
      totalStock: 100,
      dailyPrice: 450.0,
      weeklyPrice: 1900.0,
      monthlyPrice: 4500.0,
      purchasePriceEstimate: 34000.0,
      depositType: "FIXED",
      depositAmount: 4000.0,
      city: "İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 400.0,
      condition: "NEW",
      isActive: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  // Product 9: 30 High Lumen Projectors
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierCCompany.id,
      categoryId: catTech.id,
      name: "Epson 5.000 ANSI Lümen Full HD Lazer Projeksiyon Cihazı + 200x200 Perde",
      slug: "epson-5000-lumen-lazer-projeksiyon-perde",
      description: "Geniş salon sunumları ve lansmanlar için gün ışığında dahi net görüntü sağlayan 5000 lümen projeksiyon ve tripodlu perde seti.",
      brand: "Epson",
      model: "EB-L520U",
      totalStock: 30,
      dailyPrice: 1500.0,
      weeklyPrice: 5500.0,
      purchasePriceEstimate: 65000.0,
      depositType: "FIXED",
      depositAmount: 5000.0,
      city: "İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 600.0,
      setupFee: 500.0,
      condition: "NEW",
      isActive: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  // Product 10: 10 Diesel Generators
  await prisma.product.create({
    data: {
      supplierCompanyId: supplierBCompany.id,
      categoryId: catTechOps.id,
      name: "Aksa 50 kVA Süper Sessiz Kabinli Mobil Dizel Jeneratör",
      slug: "aksa-50-kva-super-sessiz-dizel-jenerator",
      description: "Açık hava festivalleri, dizi setleri ve acil durum güç ihtiyacı için düşük desibelli süper sessiz 50 kVA jeneratör. Operatörlü kiralama imkanı.",
      brand: "Aksa",
      model: "APD-50A",
      totalStock: 10,
      dailyPrice: 4500.0,
      weeklyPrice: 22000.0,
      monthlyPrice: 65000.0,
      purchasePriceEstimate: 420000.0, // Buying costs 420.000 TL
      depositType: "FIXED",
      depositAmount: 15000.0,
      city: "İstanbul",
      deliveryOption: "SUPPLIER_DELIVERS",
      deliveryFee: 3500.0,
      setupOption: "INCLUDED",
      setupFee: 0.0,
      condition: "LIKE_NEW",
      isActive: true,
      featured: true,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80", isPrimary: true, sortOrder: 1 },
        ],
      },
    },
  });

  console.log("Database seeded successfully with all categories, companies, and products!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
