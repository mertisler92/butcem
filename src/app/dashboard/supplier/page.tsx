"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, canTransitionOrder } from "@/lib/orders/state-machine";
import {
  Package,
  Calendar,
  Sparkles,
  TrendingUp,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Camera,
  AlertCircle,
  Truck,
  Wrench,
  Ban,
  Boxes,
} from "lucide-react";
import { addDays, format } from "date-fns";

export default function SupplierDashboardPage() {
  const { currentProfile, activeCompanyId } = useSession();

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [openRfqs, setOpenRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "calendar" | "rfqs" | "orders">("products");

  // New Product Modal State
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductStock, setNewProductStock] = useState("50");
  const [newProductDailyPrice, setNewProductDailyPrice] = useState("100");
  const [newProductWeeklyPrice, setNewProductWeeklyPrice] = useState("500");
  const [newProductDeposit, setNewProductDeposit] = useState("10");
  const [newProductDeliveryFee, setNewProductDeliveryFee] = useState("500");
  const [newProductImage, setNewProductImage] = useState("https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80");
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Maintenance Block Modal State
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockProductId, setBlockProductId] = useState("");
  const [blockStartDate, setBlockStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [blockEndDate, setBlockEndDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
  const [blockQuantity, setBlockQuantity] = useState("10");
  const [blockReason, setBlockReason] = useState("MAINTENANCE");
  const [blockNote, setBlockNote] = useState("Periyodik bakım ve temizlik nedeniyle bloke");
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  // Quote Submission Modal State
  const [quoteModalRfq, setQuoteModalRfq] = useState<any | null>(null);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [quoteDeliveryFee, setQuoteDeliveryFee] = useState("1000");
  const [quoteSetupFee, setQuoteSetupFee] = useState("500");
  const [quoteDeposit, setQuoteDeposit] = useState("2000");
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Handover Modal State
  const [handoverModalOrder, setHandoverModalOrder] = useState<any | null>(null);
  const [handoverType, setHandoverType] = useState<"DELIVERY" | "RETURN">("DELIVERY");
  const [handoverQty, setHandoverQty] = useState("100");
  const [handoverSignedBy, setHandoverSignedBy] = useState("Ahmet Sevkiyat Sorumlusu");
  const [handoverNotes, setHandoverNotes] = useState("Eksiksiz ve hasarsız teslim edildi.");
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  const loadSupplierData = async () => {
    try {
      if (activeCompanyId) {
        const [prodRes, ordRes, rfqRes, catRes] = await Promise.all([
          fetch(`/api/products`),
          fetch(`/api/orders?supplierCompanyId=${activeCompanyId}`),
          fetch(`/api/rfq?status=OPEN`),
          fetch(`/api/categories`),
        ]);

        if (prodRes.ok) {
          const pData = await prodRes.json();
          const supplierProds = (pData.products || []).filter(
            (p: any) => p.supplierCompanyId === activeCompanyId
          );
          setProducts(supplierProds);
        }
        if (ordRes.ok) setOrders(await ordRes.json());
        if (rfqRes.ok) setOpenRfqs(await rfqRes.json());
        if (catRes.ok) {
          const cData = await catRes.json();
          setCategories(cData);
          if (cData.length > 0 && !newProductCategory) {
            setNewProductCategory(cData[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, [activeCompanyId]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompanyId || !newProductName || !newProductCategory) return;

    setIsSubmittingProduct(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierCompanyId: activeCompanyId,
          categoryId: newProductCategory,
          name: newProductName,
          totalStock: parseInt(newProductStock, 10),
          dailyPrice: parseFloat(newProductDailyPrice),
          weeklyPrice: parseFloat(newProductWeeklyPrice),
          depositType: "PERCENTAGE",
          depositPercent: parseFloat(newProductDeposit),
          deliveryFee: parseFloat(newProductDeliveryFee),
          city: "İstanbul",
          condition: "NEW",
          imageUrl: newProductImage,
        }),
      });

      if (res.ok) {
        alert("Yeni ürün başarıyla kataloğa eklendi!");
        setAddProductModalOpen(false);
        setNewProductName("");
        loadSupplierData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockProductId) return;

    setIsSubmittingBlock(true);
    try {
      const res = await fetch("/api/supplier/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: blockProductId,
          startDate: blockStartDate,
          endDate: blockEndDate,
          quantity: parseInt(blockQuantity, 10),
          reason: blockReason,
          note: blockNote,
        }),
      });

      if (res.ok) {
        alert("Stok blokajı takvime kaydedildi!");
        setBlockModalOpen(false);
        loadSupplierData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleOpenQuoteModal = (rfq: any) => {
    setQuoteModalRfq(rfq);
    setQuoteItems(
      rfq.items.map((item: any) => ({
        rfqItemId: item.id,
        productName: item.productName,
        offeredQuantity: item.quantity,
        unitDailyPrice: 50,
      }))
    );
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalRfq || !activeCompanyId) return;

    setIsSubmittingQuote(true);
    try {
      const res = await fetch(`/api/rfq/${quoteModalRfq.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierCompanyId: activeCompanyId,
          items: quoteItems,
          deliveryFee: parseFloat(quoteDeliveryFee),
          setupFee: parseFloat(quoteSetupFee),
          depositTotal: parseFloat(quoteDeposit),
          validDays: 7,
          notes: "Mega Event garantili kurumsal teslimat teklifi.",
        }),
      });

      if (res.ok) {
        alert("Teklifiniz kiracıya başarıyla iletildi!");
        setQuoteModalRfq(null);
        loadSupplierData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus }),
      });

      if (res.ok) {
        alert(`Sipariş durumu ${nextStatus} olarak güncellendi.`);
        loadSupplierData();
      } else {
        const err = await res.json();
        alert(err.error || "Güncelleme başarısız.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverModalOrder) return;

    setIsSubmittingHandover(true);
    try {
      const res = await fetch(`/api/orders/${handoverModalOrder.id}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: handoverType,
          deliveredQuantity: parseInt(handoverQty, 10),
          photos: ["https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"],
          notes: handoverNotes,
          signedByName: handoverSignedBy,
        }),
      });

      if (res.ok) {
        alert("Tutanak başarıyla imzalandı ve sisteme kaydedildi!");
        setHandoverModalOrder(null);
        loadSupplierData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  const totalGMV = orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.grandTotal : 0), 0);
  const totalCommission = orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.platformCommissionFee : 0), 0);
  const netPayout = orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.supplierPayout : 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Tedarikçi Yönetim Merkezi
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {currentProfile.title}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Ekipman envanterinizi, rezervasyon takviminizi, RFQ tekliflerini ve teslimat tutanaklarını yönetin.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setAddProductModalOpen(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Yeni Ürün Ekle</span>
          </button>
          <button
            onClick={() => {
              if (products.length > 0) {
                setBlockProductId(products[0].id);
                setBlockModalOpen(true);
              }
            }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
          >
            <Ban className="w-4 h-4 text-rose-400" />
            <span>Bakım Blokajı Ekle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Aktif Ekipman Stoğu</div>
          <div className="text-2xl font-black text-slate-900">{products.length} Farklı Kalem</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {products.reduce((sum, p) => sum + p.totalStock, 0).toLocaleString("tr-TR")} Adet Toplam Envanter
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Yeni RFQ Fırsatları</div>
          <div className="text-2xl font-black text-indigo-600">{openRfqs.length} Açık Talep</div>
          <div className="text-[11px] text-slate-500 font-medium">Hemen teklif verebilirsiniz</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Toplam Ciro (GMV)</div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalGMV)}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Platform Komisyonu: {formatCurrency(totalCommission)} (%10)
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md space-y-2">
          <div className="text-xs font-bold text-emerald-100 uppercase">Net Tedarikçi Kazancı</div>
          <div className="text-2xl font-black">{formatCurrency(netPayout)}</div>
          <div className="text-[11px] text-emerald-100 font-medium">Doğrudan hesaba aktarılacak net tutar</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 sm:space-x-6 text-xs sm:text-sm font-bold overflow-x-auto whitespace-nowrap pb-1">
        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 flex-shrink-0 transition-all ${
            activeTab === "products"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Ürünler ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 flex-shrink-0 transition-all ${
            activeTab === "calendar"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Doluluk Takvimi</span>
        </button>

        <button
          onClick={() => setActiveTab("rfqs")}
          className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 flex-shrink-0 transition-all ${
            activeTab === "rfqs"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Açık RFQ&apos;lar ({openRfqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 flex-shrink-0 transition-all ${
            activeTab === "orders"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Truck className="w-4 h-4 text-indigo-500" />
          <span>Siparişler ({orders.length})</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100">
                    <img
                      src={product.images?.[0]?.url || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                      {product.condition}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-brand-600">{product.category?.name}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{product.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 font-semibold">Toplam Stok:</span>
                      <div className="font-extrabold text-slate-800">{product.totalStock.toLocaleString("tr-TR")} adet</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Günlük Fiyat:</span>
                      <div className="font-extrabold text-brand-600">{formatCurrency(product.dailyPrice)}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setBlockProductId(product.id);
                      setBlockModalOpen(true);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                    <span>Bakım Bloke Et</span>
                  </button>
                  <Link
                    href={`/products/${product.id}`}
                    className="text-xs font-bold text-brand-600 hover:underline"
                  >
                    Ürün Sayfası &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL CALENDAR */}
      {activeTab === "calendar" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">Envanter & Rezervasyon Takvimi</h3>
              <p className="text-xs text-slate-500">
                Ekipmanlarınızın hangi tarihlerde kiralandığını ve bakım blokajlarını izleyin.
              </p>
            </div>
            <button
              onClick={() => {
                if (products.length > 0) {
                  setBlockProductId(products[0].id);
                  setBlockModalOpen(true);
                }
              }}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow"
            >
              + Yeni Bakım Blokajı Tanımla
            </button>
          </div>

          <div className="space-y-4">
            {products.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                    <span className="text-xs text-slate-500 font-medium">Toplam Kapasite: {p.totalStock} adet</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                    Stok Durumu: Normal
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-2 border-t border-slate-200 text-center text-xs">
                  {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((day, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{day}</div>
                      <div className="font-extrabold text-emerald-600 mt-1">{p.totalStock} Müsait</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RFQ OPPORTUNITIES */}
      {activeTab === "rfqs" && (
        <div className="space-y-4">
          {openRfqs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
              Şu anda açık bir RFQ talebi bulunmuyor.
            </div>
          ) : (
            openRfqs.map((rfq) => (
              <div
                key={rfq.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{rfq.rfqNumber}</span>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-md">
                      Açık Talep
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{rfq.title}</h3>
                  <div className="text-xs text-slate-500">
                    Kiracı: <strong>{rfq.tenantCompany.name}</strong> • {rfq.city} • {formatDate(rfq.startDate)} - {formatDate(rfq.endDate)}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rfq.items.map((it: any) => (
                      <span key={it.id} className="px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-md">
                        {it.productName}: {it.quantity} adet
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenQuoteModal(rfq)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all self-start sm:self-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Teklif Gönder</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: ORDERS & PROTOCOLS */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
              Henüz gelen bir siparişiniz bulunmuyor.
            </div>
          ) : (
            orders.map((order) => {
              const statusMeta =
                ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || {
                  label: order.status,
                  color: "bg-slate-100 text-slate-700",
                };

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-3 py-1 bg-slate-900 text-white rounded-lg">
                        {order.orderNumber}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium">Net Kazancınız: </span>
                      <span className="text-lg font-black text-emerald-600">
                        {formatCurrency(order.supplierPayout)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Kiracı Şirket</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{order.tenantCompany.name}</div>
                      <div className="text-slate-500 mt-0.5">{order.deliveryAddress}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Kiralama Tarihleri</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {formatDate(order.startDate)} - {formatDate(order.endDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Ekipmanlar</div>
                      <div className="mt-0.5 space-y-1 font-semibold text-slate-700">
                        {order.items.map((it: any) => (
                          <div key={it.id}>• {it.quantity} adet {it.product?.name}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Protocol Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                    {order.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "PREPARING")}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow"
                      >
                        Teslimata Hazırla
                      </button>
                    )}

                    {order.status === "PREPARING" && (
                      <button
                        onClick={() => {
                          setHandoverModalOrder(order);
                          setHandoverType("DELIVERY");
                        }}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Teslim Tutanağı İmzala</span>
                      </button>
                    )}

                    {order.status === "ACTIVE" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "RETURN_PENDING")}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow"
                      >
                        İade Sürecini Başlat
                      </button>
                    )}

                    {order.status === "RETURN_PENDING" && (
                      <button
                        onClick={() => {
                          setHandoverModalOrder(order);
                          setHandoverType("RETURN");
                        }}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>İade Teslim Tutanağı İmzala</span>
                      </button>
                    )}

                    {order.status === "RETURNED" && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, "COMPLETED")}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
                      >
                        Kontrol Tamamlandı & Depozitoyu İade Et
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* NEW PRODUCT MODAL */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateProduct} className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">Envantere Yeni Ürün Ekle</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ürün Adı *</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Örn: 65 inç Samsung 4K Smart TV"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori *</label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Toplam Stok *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Günlük Fiyat (TL) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProductDailyPrice}
                    onChange={(e) => setNewProductDailyPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Haftalık Fiyat (TL)</label>
                  <input
                    type="number"
                    value={newProductWeeklyPrice}
                    onChange={(e) => setNewProductWeeklyPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teslimat Ücreti (TL)</label>
                  <input
                    type="number"
                    value={newProductDeliveryFee}
                    onChange={(e) => setNewProductDeliveryFee(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddProductModalOpen(false)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmittingProduct}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow"
              >
                {isSubmittingProduct ? "Ekleniyor..." : "Ürünü Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MAINTENANCE BLOCK MODAL */}
      {blockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateBlock} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Bakım / Servis Stok Blokajı</h3>
            <p className="text-xs text-slate-500">
              Belirli tarihlerde ürünlerin kiralanmasını engellemek için stok bloke edin.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ürün</label>
                <select
                  value={blockProductId}
                  onChange={(e) => setBlockProductId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Başlangıç</span>
                  <input
                    type="date"
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Bitiş</span>
                  <input
                    type="date"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bloke Edilecek Adet</label>
                <input
                  type="number"
                  min="1"
                  value={blockQuantity}
                  onChange={(e) => setBlockQuantity(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Blokaj Nedeni</label>
                <input
                  type="text"
                  value={blockNote}
                  onChange={(e) => setBlockNote(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmittingBlock}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow"
              >
                {isSubmittingBlock ? "Kaydediliyor..." : "Blokajı Uygula"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QUOTE MODAL */}
      {quoteModalRfq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmitQuote} className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900">
              RFQ Teklifi İlet — {quoteModalRfq.rfqNumber}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl font-semibold text-slate-700">
                Kiracı: {quoteModalRfq.tenantCompany.name} • {quoteModalRfq.city}
              </div>

              {quoteItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 items-center">
                  <div>
                    <div className="font-bold text-slate-800">{item.productName}</div>
                    <div className="text-[11px] text-slate-400">Teklif Adedi: {item.offeredQuantity}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Günlük Birim Fiyat (TL)</label>
                    <input
                      type="number"
                      required
                      value={item.unitDailyPrice}
                      onChange={(e) => {
                        const updated = [...quoteItems];
                        updated[idx].unitDailyPrice = parseFloat(e.target.value) || 0;
                        setQuoteItems(updated);
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-600">Teslimat Bedeli</label>
                  <input
                    type="number"
                    value={quoteDeliveryFee}
                    onChange={(e) => setQuoteDeliveryFee(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600">Kurulum Bedeli</label>
                  <input
                    type="number"
                    value={quoteSetupFee}
                    onChange={(e) => setQuoteSetupFee(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600">Depozito</label>
                  <input
                    type="number"
                    value={quoteDeposit}
                    onChange={(e) => setQuoteDeposit(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuoteModalRfq(null)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl"
              >
                Kapat
              </button>
              <button
                type="submit"
                disabled={isSubmittingQuote}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow"
              >
                {isSubmittingQuote ? "İletiliyor..." : "Teklifi Gönder"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HANDOVER PROTOCOL MODAL */}
      {handoverModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmitHandover} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">
              {handoverType === "DELIVERY" ? "Teslimat Tutanağı İmzala" : "İade Teslim Tutanağı İmzala"}
            </h3>
            <p className="text-xs text-slate-500">
              Sipariş: <strong>{handoverModalOrder.orderNumber}</strong> • Teslim edilen ekipman sayısını ve imzayı kaydedin.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Teslim Edilen Adet</label>
                <input
                  type="number"
                  required
                  value={handoverQty}
                  onChange={(e) => setHandoverQty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">İmzalayan / Teslim Eden Yetkili</label>
                <input
                  type="text"
                  required
                  value={handoverSignedBy}
                  onChange={(e) => setHandoverSignedBy(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teslimat Notu & Kondisyon</label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHandoverModalOrder(null)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmittingHandover}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow"
              >
                {isSubmittingHandover ? "Kaydediliyor..." : "Tutanağı Onayla"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
