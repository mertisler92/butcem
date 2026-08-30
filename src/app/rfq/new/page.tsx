"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Truck,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Boxes,
  Info,
} from "lucide-react";
import { format, addDays } from "date-fns";

function CreateRFQContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentProfile, activeCompanyId } = useSession();

  const [aiPrompt, setAiPrompt] = useState(
    "18-20 Kasım İstanbul Fuar Merkezi'nde etkinliğimiz var. 1.000 sandalye, 100 masa, 20 televizyon ve 10 mini buzdolabına ihtiyacımız var."
  );
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("Kurumsal Etkinlik Ekipman Kiralama Talebi");
  const [city, setCity] = useState("İstanbul");
  const [address, setAddress] = useState("İstanbul Fuar Merkezi (İFM) Hall 4");
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 9), "yyyy-MM-dd"));
  const [deliveryNeeded, setDeliveryNeeded] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(true);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([
    { productName: "Sandalye", quantity: 1000, categorySlug: "etkinlik-organizasyon" },
    { productName: "Masa", quantity: 100, categorySlug: "etkinlik-organizasyon" },
    { productName: "Televizyon", quantity: 20, categorySlug: "fuar-stand" },
    { productName: "Mini Buzdolabı", quantity: 10, categorySlug: "fuar-stand" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if loaded from session storage or prefilled
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("prefilled_rfq");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.city) setCity(parsed.city);
          if (parsed.address) setAddress(parsed.address);
          if (parsed.startDate) setStartDate(parsed.startDate);
          if (parsed.endDate) setEndDate(parsed.endDate);
          if (parsed.items) setItems(parsed.items);
          if (parsed.deliveryNeeded !== undefined) setDeliveryNeeded(parsed.deliveryNeeded);
          if (parsed.setupNeeded !== undefined) setSetupNeeded(parsed.setupNeeded);
          sessionStorage.removeItem("prefilled_rfq");
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleAiParse = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/parse-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.city) setCity(data.city);
        if (data.address) setAddress(data.address);
        if (data.startDate) setStartDate(data.startDate);
        if (data.endDate) setEndDate(data.endDate);
        if (data.items && data.items.length > 0) setItems(data.items);
        if (data.deliveryNeeded !== undefined) setDeliveryNeeded(data.deliveryNeeded);
        if (data.setupNeeded !== undefined) setSetupNeeded(data.setupNeeded);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { productName: "", quantity: 1, categorySlug: "etkinlik-organizasyon" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompanyId) {
      alert("Lütfen önce üst menüden bir kiracı şirket seçin.");
      return;
    }

    if (items.length === 0) {
      alert("Lütfen en az bir ekipman kalemi ekleyin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantCompanyId: activeCompanyId,
          title,
          city,
          address,
          startDate,
          endDate,
          deliveryNeeded,
          setupNeeded,
          notes,
          items,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Talep oluşturulamadı.");
      }

      const rfq = await res.json();
      router.push(`/rfq/${rfq.id}`);
    } catch (err: any) {
      alert(err.message || "Talep gönderilirken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-extrabold border border-brand-200">
          <Boxes className="w-3.5 h-3.5" />
          <span>Toplu RFQ & Teklif Toplama</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
          Yeni Kiralama Talebi (RFQ) Oluştur
        </h1>
        <p className="text-slate-500 text-sm">
          İhtiyaç duyduğunuz tüm ekipmanları tek seferde listeleyin, sistem en uygun tekli veya çoklu tedarikçi çözümlerini anında hazırlasın.
        </p>
      </div>

      {/* AI Assistance Box */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-xl border border-slate-700">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Yapay Zeka Asistanı: Doğal Dilde İhtiyacınızı Yazın</span>
        </div>
        <p className="text-xs text-slate-300">
          Tarih, adet ve mekan bilgisini serbest metin olarak girin; yapay zeka formu sizin için otomatik doldursun.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Örn: 10-12 Ekim Maslak'ta fuarımız var, 1000 sandalye ve 20 TV lazım..."
            className="flex-1 bg-slate-950/80 border border-slate-700 text-xs sm:text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-brand-400 text-slate-100"
          />
          <button
            type="button"
            onClick={handleAiParse}
            disabled={isAiLoading}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all flex-shrink-0"
          >
            {isAiLoading ? "Analiz Ediliyor..." : "AI ile Doldur"}
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmitRFQ} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
        {/* Talep Başlığı & Konum */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            1. Genel Bilgiler & Lokasyon
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Talep Başlığı *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Şehir *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-800"
              >
                <option value="İstanbul">İstanbul</option>
                <option value="Ankara">Ankara</option>
                <option value="İzmir">İzmir</option>
                <option value="Antalya">Antalya</option>
                <option value="Bursa">Bursa</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700">Etkinlik / Teslimat Alanı Adresi</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Örn: İstanbul Fuar Merkezi (İFM) Hall 4, Yeşilköy"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Tarihler & Lojistik */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            2. Tarih Aralığı & Hizmet İhtiyaçları
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Kiralama Başlangıç Tarihi *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Kiralama Bitiş Tarihi *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={deliveryNeeded}
                onChange={(e) => setDeliveryNeeded(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <Truck className="w-4 h-4 text-brand-600" />
              <span>Tedarikçi Adrese Nakliye / Teslimat Sağlasın</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={setupNeeded}
                onChange={(e) => setSetupNeeded(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>Kurulum & Montaj Hizmeti Gerekiyor</span>
            </label>
          </div>
        </div>

        {/* Ekipman Listesi (Items) */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              3. İhtiyaç Duyulan Ekipman Kalemleri
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ekipman Ekle</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Ekipman Adı / Tanımı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Sandalye, Masa, 65 inç TV..."
                    value={item.productName}
                    onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    İhtiyaç Adedi *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Kategori
                  </label>
                  <select
                    value={item.categorySlug || "etkinlik-organizasyon"}
                    onChange={(e) => handleItemChange(index, "categorySlug", e.target.value)}
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-700"
                  >
                    <option value="etkinlik-organizasyon">Etkinlik</option>
                    <option value="fuar-stand">Fuar & Stand</option>
                    <option value="endustriyel-mutfak">Mutfak</option>
                    <option value="teknoloji">Teknoloji</option>
                    <option value="ofis">Ofis</option>
                    <option value="teknik-operasyon">Teknik/Jeneratör</option>
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 1}
                    className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    title="Satırı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-brand-600" />
            <span>Talebiniz yayınlandığında ilgili tedarikçiler anında bilgilendirilir.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? "Talep Yayınlanıyor..." : "Talebi Yayınla & Teklifleri Gör"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateRFQPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Yükleniyor...</div>}>
      <CreateRFQContent />
    </Suspense>
  );
}
