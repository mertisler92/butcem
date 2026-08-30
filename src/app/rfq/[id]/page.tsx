"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Boxes,
  Calendar,
  MapPin,
  Truck,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Building,
  Check,
  AlertCircle,
} from "lucide-react";

export async function generateStaticParams() {
  return [
    { id: "rfq_demo_1" },
    { id: "cmtg4fuer000mrfq001" },
  ];
}

export default function RFQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { currentProfile, activeCompanyId } = useSession();

  const [rfqData, setRfqData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"multi" | "quotes" | "messages">("multi");

  // Messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Quote / Solution Acceptance state
  const [isAccepting, setIsAccepting] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/rfq/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRfqData(data);
      }

      const msgRes = await fetch(`/api/messages?rfqId=${id}`);
      if (msgRes.ok) {
        const msgs = await msgRes.json();
        setMessages(msgs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfqId: id,
          senderUserId: currentProfile.key,
          senderName: currentProfile.title,
          content: newMessageText,
        }),
      });

      if (res.ok) {
        setNewMessageText("");
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleAcceptSingleQuote = async (quoteId: string) => {
    if (!confirm("Bu teklifi onaylayıp sipariş oluşturmak istiyor musunuz?")) return;

    setIsAccepting(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Teklif kabul edilemedi.");
      }

      alert("Teklif onaylandı! Ödeme ve teslimat takibi için Kiracı Paneline yönlendiriliyorsunuz.");
      router.push("/dashboard/tenant");
    } catch (err: any) {
      alert(err.message || "Hata oluştu.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleAcceptMultiSolution = async (allocations: any[]) => {
    if (!confirm("Bu çoklu tedarikçi kombinasyonunu onaylayıp siparişleri oluşturmak istiyor musunuz?")) return;

    setIsAccepting(true);
    try {
      const res = await fetch(`/api/rfq/${id}/accept-multi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Çoklu tedarikçi siparişi oluşturulamadı.");
      }

      alert("Çoklu tedarikçi siparişleri oluşturuldu! Kiracı Paneline yönlendiriliyorsunuz.");
      router.push("/dashboard/tenant");
    } catch (err: any) {
      alert(err.message || "Hata oluştu.");
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading && !rfqData) {
    return <div className="p-12 text-center text-slate-500 font-semibold">Talep ve teklifler yükleniyor...</div>;
  }

  if (!rfqData?.rfq) {
    return (
      <div className="p-12 text-center space-y-3">
        <h3 className="text-xl font-bold text-slate-800">Talep bulunamadı</h3>
        <Link href="/products" className="text-brand-600 font-bold">Kataloğa Dön</Link>
      </div>
    );
  }

  const { rfq, itemSolutions } = rfqData;
  const quotes = rfq.quotes || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / RFQ Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg">
                {rfq.rfqNumber}
              </span>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
                  rfq.status === "ACCEPTED"
                    ? "bg-emerald-100 text-emerald-800"
                    : rfq.status === "QUOTED"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {rfq.status === "ACCEPTED"
                  ? "Teklif Kabul Edildi / Siparişleşti"
                  : rfq.status === "QUOTED"
                  ? `${quotes.length} Teklif Alındı`
                  : "Açık Talep"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 pt-1">
              {rfq.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Talep Eden: <strong>{rfq.tenantCompany.name}</strong> • Oluşturulma: {formatDate(rfq.createdAt)}
            </p>
          </div>

          {/* Location & Dates Pill */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Lokasyon</div>
                <div className="font-bold text-slate-800">{rfq.city} {rfq.address ? `• ${rfq.address}` : ""}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Kiralama Tarihleri</div>
                <div className="font-bold text-slate-800">
                  {formatDate(rfq.startDate, "d MMM")} - {formatDate(rfq.endDate, "d MMM yyyy")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requested Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Talep Edilen Ekipman Listesi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {rfq.items.map((it: any) => (
              <div
                key={it.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{it.productName}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{it.category?.name || "Ekipman"}</div>
                </div>
                <span className="text-lg font-black text-brand-600">
                  {it.quantity.toLocaleString("tr-TR")} <span className="text-xs text-slate-400 font-normal">adet</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Smooth horizontal scroll on mobile) */}
      <div className="flex border-b border-slate-200 space-x-4 sm:space-x-6 text-xs sm:text-sm font-bold overflow-x-auto whitespace-nowrap pb-1">
        <button
          onClick={() => setActiveTab("multi")}
          className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 flex-shrink-0 transition-all ${
            activeTab === "multi"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Çoklu Tedarikçi Çözümü</span>
        </button>

        <button
          onClick={() => setActiveTab("quotes")}
          className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 flex-shrink-0 transition-all ${
            activeTab === "quotes"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span>Teklifler ({quotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("messages")}
          className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 flex-shrink-0 transition-all ${
            activeTab === "messages"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Mesajlar ({messages.length})</span>
        </button>
      </div>

      {/* TAB 1: MULTI-SUPPLIER SOLVER */}
      {activeTab === "multi" && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Algoritmik Stok Eşleştirme Motoru</div>
              <p className="mt-0.5 text-amber-800">
                KiralaPro algoritması, talebinizdeki yüksek adetleri (örn. 1.000 sandalye) piyasadaki en uygun fiyatlı tedarikçilerden otomatik olarak bölerek eksiksiz karşılar.
              </p>
            </div>
          </div>

          {itemSolutions && itemSolutions.length > 0 ? (
            itemSolutions.map((solItem: any, index: number) => {
              const multi = solItem.solutions?.multiSupplierSolution;
              return (
                <div
                  key={index}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Ekipman Kalemi</div>
                      <h3 className="text-xl font-black text-slate-900">
                        {solItem.productName} — {solItem.requestedQuantity.toLocaleString("tr-TR")} Adet
                      </h3>
                    </div>
                    {multi && (
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-semibold">Tahmini Toplam Maliyet</div>
                        <div className="text-2xl font-black text-brand-600">
                          {formatCurrency(multi.estimatedTotal)}
                        </div>
                      </div>
                    )}
                  </div>

                  {multi ? (
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-slate-600">
                        Tedarikçi Dağılımı ({multi.allocations.length} Tedarikçi Kombinasyonu):
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {multi.allocations.map((alloc: any, aIdx: number) => (
                          <div
                            key={aIdx}
                            className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-slate-900 text-sm">
                                {alloc.supplierName}
                              </div>
                              <span className="px-2.5 py-1 bg-brand-100 text-brand-800 rounded-lg text-xs font-extrabold">
                                {alloc.offeredQuantity.toLocaleString("tr-TR")} adet
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {alloc.productName}
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-semibold text-slate-700">
                              <span>Birim Fiyat: {formatCurrency(alloc.unitDailyPrice)} / gün</span>
                              <span className="text-slate-900 font-bold">{formatCurrency(alloc.lineTotal)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Accept button */}
                      {rfq.status !== "ACCEPTED" && (
                        <div className="pt-4 flex justify-end">
                          <button
                            onClick={() => handleAcceptMultiSolution(multi.allocations)}
                            disabled={isAccepting}
                            className="px-8 py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl shadow-brand-500/25 flex items-center gap-2 transition-all hover:scale-[1.01]"
                          >
                            {isAccepting ? "Siparişler Oluşturuluyor..." : "Bu Çoklu Paketi Kabul Et & Siparişi Başlat"}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Bu kalem için otomatik çoklu eşleştirme oluşturulamadı.
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm bg-white rounded-3xl border border-slate-200">
              Eşleştirme hesaplanıyor...
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INDIVIDUAL QUOTES */}
      {activeTab === "quotes" && (
        <div className="space-y-6">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Henüz tedarikçilerden manuel teklif gelmedi</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tedarikçiler talebinizi inceleyip özel fiyat teklifi ilettiğinde burada listelenecektir.
              </p>
            </div>
          ) : (
            quotes.map((quote: any) => (
              <div
                key={quote.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-lg">
                        {quote.supplierCompany.name}
                      </span>
                      {quote.supplierCompany.supplierProfile?.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      Teklif No: {quote.quoteNumber} • Geçerlilik: {formatDate(quote.validUntil)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-semibold">Teklif Tutarı (KDV & Depozito Dahil)</div>
                    <div className="text-2xl font-black text-brand-600">
                      {formatCurrency(quote.grandTotal)}
                    </div>
                  </div>
                </div>

                {/* Items & Financial Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2">
                    <div className="font-bold text-slate-700">Teklif Edilen Ürünler:</div>
                    {quote.items.map((qItem: any) => (
                      <div key={qItem.id} className="p-3 bg-slate-50 rounded-xl flex justify-between">
                        <span>{qItem.productName} ({qItem.offeredQuantity} adet)</span>
                        <span className="font-bold text-slate-900">{formatCurrency(qItem.lineTotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="flex justify-between text-slate-600">
                      <span>Ekipman Bedeli:</span>
                      <span className="font-semibold">{formatCurrency(quote.productTotal)}</span>
                    </div>
                    {quote.deliveryFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Teslimat:</span>
                        <span>{formatCurrency(quote.deliveryFee)}</span>
                      </div>
                    )}
                    {quote.setupFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Kurulum / Montaj:</span>
                        <span>{formatCurrency(quote.setupFee)}</span>
                      </div>
                    )}
                    {quote.depositTotal > 0 && (
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>Depozito:</span>
                        <span>{formatCurrency(quote.depositTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>KDV:</span>
                      <span>{formatCurrency(quote.vatTotal)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200 text-sm">
                      <span>Toplam:</span>
                      <span className="text-brand-600">{formatCurrency(quote.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {rfq.status !== "ACCEPTED" && quote.status === "PENDING" && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleAcceptSingleQuote(quote.id)}
                      disabled={isAccepting}
                      className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition-all"
                    >
                      {isAccepting ? "İşleniyor..." : "Bu Teklifi Kabul Et & Siparişleş"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: MESSAGING */}
      {activeTab === "messages" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Talep İletişim Geçmişi
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {messages.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-6">
                Henüz mesaj gönderilmedi. Aşağıdaki alandan soru sorabilirsiniz.
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-slate-700">{m.senderName}</span>
                    <span>{formatDate(m.createdAt, "d MMM HH:mm")}</span>
                  </div>
                  <p className="text-slate-800">{m.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Tedarikçilere soru sorun veya detay iletin..."
              className="flex-1 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-800"
            />
            <button
              type="submit"
              disabled={isSendingMessage}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gönder</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
