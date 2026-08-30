"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Truck,
  Wrench,
  TrendingDown,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  CreditCard,
  Building,
  Check,
} from "lucide-react";
import { addDays, format } from "date-fns";

export async function generateStaticParams() {
  return [
    { id: "prod_chair_mega" },
    { id: "prod_chair_pro" },
    { id: "prod_tv_65" },
    { id: "prod_table_round" },
    { id: "prod_fryer_double" },
    { id: "prod_generator_100" },
    { id: "cmtg4fuer000ccgysk65fbbem" },
    { id: "cmtg4fuer000dcgys4dzzbbem" },
    { id: "cmtg4fuer000ecgys5gzzbbem" },
    { id: "cmtg4fuer000fcgys6hzzbbem" },
  ];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentProfile, activeCompanyId } = useSession();

  const defaultDemoProduct = DEMO_PRODUCTS.find((p) => p.id === id) || DEMO_PRODUCTS[0];
  const [productData, setProductData] = useState<any>({ product: defaultDemoProduct });
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Form State
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || format(addDays(new Date(), 7), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") || format(addDays(new Date(), 9), "yyyy-MM-dd")
  );
  const [quantity, setQuantity] = useState<number>(
    parseInt(searchParams.get("quantity") || "100", 10)
  );
  const [includeDelivery, setIncludeDelivery] = useState(true);
  const [includeSetup, setIncludeSetup] = useState(false);

  // Modal / Checkout state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<"SANDBOX" | "BANK_TRANSFER" | "CARI">("SANDBOX");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<any>(null);

  // Fetch product and live calculation
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          startDate,
          endDate,
          quantity: quantity.toString(),
          includeDelivery: includeDelivery ? "true" : "false",
          includeSetup: includeSetup ? "true" : "false",
        });

        const res = await fetch(`/api/products/${id}?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProductData(data);
        }
      } catch (err) {
        console.error("Failed to load product details", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id, startDate, endDate, quantity, includeDelivery, includeSetup]);

  if (loading && !productData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 font-semibold">
        Ürün detayları ve müsaitlik durumu yükleniyor...
      </div>
    );
  }

  if (!productData?.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Ürün bulunamadı</h2>
        <Link href="/products" className="text-brand-600 font-bold hover:underline">
          &larr; Kataloğa Geri Dön
        </Link>
      </div>
    );
  }

  const { product, availability, pricing } = productData;
  const supplier = product.supplierCompany;
  const images = product.images || [];

  const handleInstantRent = async () => {
    if (!activeCompanyId) {
      alert("Lütfen önce üst menüden bir şirket profili seçin.");
      return;
    }

    setIsCheckingOut(true);
    try {
      // 1. Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          tenantCompanyId: activeCompanyId,
          startDate,
          endDate,
          quantity,
          deliveryOption: includeDelivery ? "SUPPLIER_DELIVERS" : "TENANT_PICKUP",
          deliveryAddress: deliveryAddress || `${product.city} Etkinlik Alanı`,
          deliveryCity: product.city,
          includeSetup,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Sipariş oluşturulamadı.");
      }

      const order = await orderRes.json();

      // 2. Pay and confirm order
      const payRes = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: paymentProvider,
        }),
      });

      if (!payRes.ok) {
        const payErr = await payRes.json();
        throw new Error(payErr.error || "Ödeme onaylanamadı.");
      }

      const payData = await payRes.json();
      setCheckoutSuccessOrder(payData.order);
    } catch (err: any) {
      alert(err.message || "İşlem sırasında bir hata oluştu.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 font-medium truncate">
        <Link href="/products" className="hover:text-brand-600 flex-shrink-0">
          Katalog
        </Link>
        <span>/</span>
        <Link
          href={`/products?category=${product.category?.slug}`}
          className="hover:text-brand-600 truncate max-w-[120px]"
        >
          {product.category?.name}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photos & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={
                  images[activeImageIndex]?.url ||
                  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"
                }
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
                {product.condition === "NEW"
                  ? "Sıfır / Yeni"
                  : product.condition === "LIKE_NEW"
                  ? "Çok İyi Durumda"
                  : "İyi Durumda"}
              </div>
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img: any, idx: number) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      idx === activeImageIndex ? "border-brand-600 ring-2 ring-brand-500/20" : "border-slate-200 opacity-70"
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Header & Metadata */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg">
                {product.category?.name}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{product.city} {product.address ? `(${product.address})` : ""}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Toplam Filo: {product.totalStock.toLocaleString("tr-TR")} adet</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Brand & Model tags */}
            {(product.brand || product.model) && (
              <div className="flex items-center gap-4 text-xs text-slate-600">
                {product.brand && (
                  <div>
                    <span className="text-slate-400 font-semibold">Marka: </span>
                    <span className="font-bold text-slate-800">{product.brand}</span>
                  </div>
                )}
                {product.model && (
                  <div>
                    <span className="text-slate-400 font-semibold">Model / Seri: </span>
                    <span className="font-bold text-slate-800">{product.model}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Ürün Açıklaması & Özellikler
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Delivery & Setup Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                <Truck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Lojistik & Teslimat</div>
                  <div className="text-slate-500 mt-0.5">
                    {product.deliveryOption === "SUPPLIER_DELIVERS"
                      ? `Tedarikçi Teslimatı (${formatCurrency(product.deliveryFee)})`
                      : "Kiracı Kendi Aracıyla Teslim Alır"}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
                <Wrench className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Kurulum & Montaj</div>
                  <div className="text-slate-500 mt-0.5">
                    {product.setupOption === "INCLUDED"
                      ? "Ücretsiz Kurulum Dahildir"
                      : product.setupOption === "OPTIONAL"
                      ? `Opsiyonel Montaj (${formatCurrency(product.setupFee)})`
                      : "Kurulum Gerektirmez"}
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Profile Card */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Tedarikçi Şirket</div>
                  <h4 className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                    {supplier.name}
                    {supplier.supplierProfile?.isVerified && (
                      <span title="Doğrulanmış Tedarikçi">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </span>
                    )}
                  </h4>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{supplier.supplierProfile?.rating || 5.0} ({supplier.supplierProfile?.reviewCount || 0} değerlendirme)</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">
                {supplier.supplierProfile?.description || "Kurumsal kiralama tedarikçisi."}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 border-t border-slate-700">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  <span>Yanıt Süresi: ~{supplier.supplierProfile?.responseTimeMinutes || 30} dk</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{supplier.supplierProfile?.completedRentals || 100}+ Başarılı Kiralama</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Booking Calculator & Instant Rent (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xl space-y-6 sticky top-24">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Fiyatlandırma
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900">
                  {formatCurrency(product.dailyPrice)}
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ gün (birim)</span>
              </div>
              {product.weeklyPrice && (
                <div className="text-xs text-brand-600 font-semibold mt-1">
                  Haftalık İndirimli: {formatCurrency(product.weeklyPrice)} / hafta
                </div>
              )}
            </div>

            {/* Availability Date & Quantity Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Kiralama Tarihleri
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold">Başlangıç</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold">Bitiş</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Kiralanacak Adet
                </label>
                <input
                  type="number"
                  min="1"
                  max={product.totalStock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full mt-1 p-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              {/* Service Options */}
              <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 font-medium">Tedarikçi Adrese Teslimat</span>
                  <input
                    type="checkbox"
                    checked={includeDelivery}
                    onChange={(e) => setIncludeDelivery(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                </label>
                {product.setupOption !== "NONE" && (
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 font-medium">Kurulum & Montaj Hizmeti</span>
                    <input
                      type="checkbox"
                      checked={includeSetup}
                      onChange={(e) => setIncludeSetup(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Real-Time Stock Availability Indicator */}
            {availability && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  availability.isAvailable
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {availability.isAvailable ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      Seçilen tarihlerde ({startDate} - {endDate}) talep ettiğiniz <strong>{quantity} adet</strong> stokta kesinlikle müsait.
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>
                      Seçilen tarihlerde stok yetersiz! En fazla <strong>{availability.availableQuantity} adet</strong> rezerve edilebilir.
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Financial Breakdown Table */}
            {pricing && (
              <div className="space-y-2.5 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    Kiralama ({pricing.rentalDays} gün × {pricing.quantity} adet)
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(pricing.subtotal)}
                  </span>
                </div>

                {pricing.volumeDiscountPercent > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Toplu Adet İndirimi (%{pricing.volumeDiscountPercent})</span>
                    <span>-{formatCurrency(pricing.volumeDiscountAmount)}</span>
                  </div>
                )}

                {pricing.deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Teslimat Ücreti</span>
                    <span className="font-semibold">{formatCurrency(pricing.deliveryFee)}</span>
                  </div>
                )}

                {pricing.setupFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Kurulum / Montaj</span>
                    <span className="font-semibold">{formatCurrency(pricing.setupFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>KDV (%{pricing.vatRate})</span>
                  <span className="font-semibold">{formatCurrency(pricing.vatAmount)}</span>
                </div>

                {pricing.depositAmount > 0 && (
                  <div className="flex justify-between text-amber-700 bg-amber-50/70 p-2 rounded-lg font-medium">
                    <span>Depozito Teminatı (İade Edilir)</span>
                    <span className="font-bold">{formatCurrency(pricing.depositAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-base font-black text-slate-900">
                  <span>Genel Toplam:</span>
                  <span className="text-2xl text-brand-600">
                    {formatCurrency(pricing.grandTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Purchase Savings Box */}
            {pricing?.estimatedPurchaseCost && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  <span>Satın Alma vs Kiralama Tasarrufu</span>
                </div>
                <div className="text-xs text-emerald-900 flex justify-between">
                  <span>Tahmini Satın Alma Maliyeti:</span>
                  <span className="font-bold">{formatCurrency(pricing.estimatedPurchaseCost)}</span>
                </div>
                <div className="text-xs text-emerald-900 flex justify-between">
                  <span>Kiralama Maliyeti:</span>
                  <span className="font-bold">{formatCurrency(pricing.grandTotal)}</span>
                </div>
                <div className="pt-1.5 border-t border-emerald-200 flex justify-between font-black text-sm text-emerald-700">
                  <span>Net Şirket Tasarrufu:</span>
                  <span>{formatCurrency(pricing.estimatedSavings)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setCheckoutModalOpen(true)}
                disabled={availability && !availability.isAvailable}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Hemen Kirala (Rezervasyon Yap)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => router.push(`/rfq/new?productId=${product.id}`)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Özel Toplu RFQ Talebine Ekle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            {checkoutSuccessOrder ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Rezervasyonunuz Onaylandı!
                </h3>
                <p className="text-sm text-slate-500">
                  Sipariş No: <strong>{checkoutSuccessOrder.orderNumber}</strong>
                  <br />
                  Stok takvimde adınıza bloke edildi ve tedarikçiye bildirim iletildi.
                </p>
                <div className="pt-4 flex gap-3 justify-center">
                  <button
                    onClick={() => router.push("/dashboard/tenant")}
                    className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl text-sm shadow-md"
                  >
                    Kiracı Paneline Git
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Kiralama & Ödeme Onayı
                    </h3>
                    <p className="text-xs text-slate-500">
                      Aktif Şirket: <strong>{currentProfile.title}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setCheckoutModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Teslimat Adresi
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Örn: Maslak Fuar Kongre Merkezi Ana Salon"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Ödeme & Teminat Yöntemi
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentProvider("SANDBOX")}
                        className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                          paymentProvider === "SANDBOX"
                            ? "bg-brand-50 border-brand-500 text-brand-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Sandbox Test Kartı</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentProvider("BANK_TRANSFER")}
                        className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                          paymentProvider === "BANK_TRANSFER"
                            ? "bg-brand-50 border-brand-500 text-brand-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        <span>Havale / EFT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentProvider("CARI")}
                        className={`p-3 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all ${
                          paymentProvider === "CARI"
                            ? "bg-brand-50 border-brand-500 text-brand-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>Kurumsal Cari</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>{quantity} adet {product.name} ({pricing?.rentalDays} gün)</span>
                      <span>{formatCurrency(pricing?.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Ödenecek Tutar:</span>
                      <span className="text-brand-600">{formatCurrency(pricing?.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleInstantRent}
                  disabled={isCheckingOut}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-brand-500/30 transition-all"
                >
                  {isCheckingOut ? "Ödeme ve Rezervasyon İşleniyor..." : "Ödemeyi Onayla ve Kirala"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
