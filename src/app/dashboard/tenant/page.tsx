"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/orders/state-machine";
import {
  Package,
  Clock,
  CheckCircle2,
  FileText,
  AlertTriangle,
  CreditCard,
  Building,
  PlusCircle,
  TrendingDown,
  Star,
  Camera,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function TenantDashboardPage() {
  const { currentProfile, activeCompanyId } = useSession();

  const [orders, setOrders] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "rfqs">("orders");

  // Dispute / Damage Claim Modal
  const [claimModalOrderId, setClaimModalOrderId] = useState<string | null>(null);
  const [claimDescription, setClaimDescription] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Review Modal
  const [reviewModalOrder, setReviewModalOrder] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadTenantData = async () => {
    try {
      if (activeCompanyId) {
        const [ordersRes, rfqsRes] = await Promise.all([
          fetch(`/api/orders?tenantCompanyId=${activeCompanyId}`),
          fetch(`/api/rfq?tenantCompanyId=${activeCompanyId}`),
        ]);

        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (rfqsRes.ok) setRfqs(await rfqsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, [activeCompanyId]);

  const handlePayOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "SANDBOX" }),
      });

      if (res.ok) {
        alert("Ödeme başarıyla alındı ve stok rezervasyonu kesinleşti.");
        loadTenantData();
      } else {
        const err = await res.json();
        alert(err.error || "Ödeme başarısız.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimModalOrderId || !claimDescription || !claimAmount) return;

    setIsSubmittingClaim(true);
    try {
      const res = await fetch(`/api/orders/${claimModalOrderId}/damage-claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: claimDescription,
          claimedAmount: parseFloat(claimAmount),
          photos: ["https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80"],
        }),
      });

      if (res.ok) {
        alert("Hasar/Eksik bildirimi iletildi. Admin inceleme başlattı.");
        setClaimModalOrderId(null);
        setClaimDescription("");
        setClaimAmount("");
        loadTenantData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: reviewModalOrder.id,
          reviewerCompanyId: activeCompanyId,
          revieweeCompanyId: reviewModalOrder.supplierCompanyId,
          role: "TENANT_TO_SUPPLIER",
          overallRating: rating,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        alert("Değerlendirmeniz için teşekkür ederiz!");
        setReviewModalOrder(null);
        setReviewComment("");
        loadTenantData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const activeOrders = orders.filter((o) =>
    ["CONFIRMED", "PREPARING", "DELIVERED", "ACTIVE", "RETURN_PENDING"].includes(o.status)
  );

  const totalSpent = orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.grandTotal : 0), 0);
  const estimatedSavings = totalSpent * 4.5; // Estimated savings heuristic vs outright buying

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Kiracı Yönetim Paneli
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold">
              {currentProfile.title}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Aktif kiralamalarınızı, açık RFQ taleplerinizi ve teslimat protokollerini takip edin.
          </p>
        </div>

        <Link
          href="/rfq/new"
          className="px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Yeni Kiralama Talebi Aç</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Aktif Kiralamalar</div>
          <div className="text-2xl font-black text-slate-900">{activeOrders.length} Sipariş</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Sevkiyat & kullanımda
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Açık RFQ Talepleri</div>
          <div className="text-2xl font-black text-brand-600">{rfqs.length} Talep</div>
          <div className="text-[11px] text-slate-500 font-medium">Tedarikçi teklifleri toplanıyor</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase">Toplam Kiralama Tutarı</div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalSpent)}</div>
          <div className="text-[11px] text-slate-500 font-medium">KDV ve depozito dahil</div>
        </div>

        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md space-y-2">
          <div className="text-xs font-bold text-emerald-100 uppercase flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Tahmini Satın Alma Tasarrufu</span>
          </div>
          <div className="text-2xl font-black">{formatCurrency(estimatedSavings)}</div>
          <div className="text-[11px] text-emerald-100 font-medium">Satın almak yerine kiralayarak elde edildi</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 sm:space-x-6 text-xs sm:text-sm font-bold overflow-x-auto whitespace-nowrap pb-1">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 flex-shrink-0 transition-all ${
            activeTab === "orders"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Kiralamalarım & Siparişler ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("rfqs")}
          className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 flex-shrink-0 transition-all ${
            activeTab === "rfqs"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Açık RFQ Taleplerim ({rfqs.length})</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800">Henüz bir kiralama siparişiniz bulunmuyor</h4>
              <p className="text-xs text-slate-500">
                Ekipman kataloğundan doğrudan kiralayabilir veya RFQ oluşturarak tedarikçilerden fiyat alabilirsiniz.
              </p>
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
                      <span className="text-xs text-slate-400 font-medium">Toplam Tutar: </span>
                      <span className="text-lg font-black text-slate-900">
                        {formatCurrency(order.grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tedarikçi</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">
                        {order.supplierCompany.name}
                      </div>
                      <div className="text-slate-500 mt-1">
                        Teslimat: {order.deliveryAddress} ({order.deliveryCity})
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Tarih Aralığı</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {formatDate(order.startDate)} - {formatDate(order.endDate)}
                      </div>
                      <div className="text-slate-500 mt-1">
                        Depozito: {formatCurrency(order.depositTotal)} ({order.depositRecord?.status || "HELD"})
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Kiralanan Ekipmanlar</div>
                      <div className="mt-1 space-y-1">
                        {order.items.map((it: any) => (
                          <div key={it.id} className="font-semibold text-slate-700">
                            • {it.quantity} adet {it.product?.name || "Ekipman"}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Handover Protocols & Photo Logs */}
                  {order.protocols && order.protocols.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-200/80">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-brand-600" />
                        <span>Kayıtlı Teslim / İade Tutanakları</span>
                      </div>
                      {order.protocols.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                          <div>
                            <span className="font-bold text-slate-800">
                              {p.type === "DELIVERY" ? "Teslimat Tutanağı" : "İade Teslim Tutanağı"}:
                            </span>{" "}
                            {p.deliveredQuantity} adet ürün • İmzalayan: {p.signedByName} ({formatDate(p.signedAt)})
                          </div>
                          <span className="text-[11px] text-emerald-600 font-bold">Onaylandı ✓</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                    {order.status === "PAYMENT_PENDING" && (
                      <button
                        onClick={() => handlePayOrder(order.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Ödemeyi Tamamla ({formatCurrency(order.grandTotal)})</span>
                      </button>
                    )}

                    {["DELIVERED", "ACTIVE", "RETURNED", "INSPECTING"].includes(order.status) && (
                      <button
                        onClick={() => setClaimModalOrderId(order.id)}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Hasar / Eksik Bildir</span>
                      </button>
                    )}

                    {order.status === "COMPLETED" && (
                      <button
                        onClick={() => setReviewModalOrder(order)}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>Tedarikçiyi Puanla</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: RFQS */}
      {activeTab === "rfqs" && (
        <div className="space-y-4">
          {rfqs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800">Açık kiralama talebiniz yok</h4>
              <Link
                href="/rfq/new"
                className="inline-block px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl"
              >
                Yeni Talep Aç
              </Link>
            </div>
          ) : (
            rfqs.map((rfq) => (
              <div
                key={rfq.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{rfq.rfqNumber}</span>
                    <span className="px-2.5 py-0.5 bg-brand-100 text-brand-800 text-[11px] font-bold rounded-md">
                      {rfq.quotes?.length || 0} Teklif Alındı
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{rfq.title}</h3>
                  <div className="text-xs text-slate-400">
                    {rfq.city} • {formatDate(rfq.startDate)} - {formatDate(rfq.endDate)}
                  </div>
                </div>

                <Link
                  href={`/rfq/${rfq.id}`}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <span>Teklifleri İncele & Karşılaştır</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* DAMAGE CLAIM MODAL */}
      {claimModalOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmitClaim} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Hasar / Eksik Ekipman Bildirimi</h3>
            <p className="text-xs text-slate-500">
              Teslim aldığınız veya iade ettiğiniz ekipmanda hasar/eksik tespit ettiyseniz tutar ve açıklama girin.
            </p>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">Açıklama *</label>
              <textarea
                required
                rows={3}
                value={claimDescription}
                onChange={(e) => setClaimDescription(e.target.value)}
                placeholder="Örn: 5 adet sandalyenin ayağı kırık teslim edildi."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">Talep Edilen Tazminat Tutarı (TL) *</label>
              <input
                type="number"
                required
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="Örn: 1500"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-800"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClaimModalOrderId(null)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmittingClaim}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow"
              >
                {isSubmittingClaim ? "İletiliyor..." : "Bildirimi İlet"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmitReview} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Tedarikçi Değerlendirmesi</h3>
            <p className="text-xs text-slate-500">
              <strong>{reviewModalOrder.supplierCompany.name}</strong> ile kiralama deneyiminizi 1-5 puan arasında oylayın.
            </p>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">Puanınız</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-2"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating ? "text-amber-500 fill-amber-400" : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">Yorumunuz</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Ürün kalitesi, zamanında teslimat ve iletişim nasıldı?"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalOrder(null)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl"
              >
                Kapat
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow"
              >
                {isSubmittingReview ? "Kaydediliyor..." : "Puanı Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
