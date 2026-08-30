"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HeroSearch from "@/components/HeroSearch";
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [aiPrompt, setAiPrompt] = useState(
    "18-20 Kasım İstanbul Fuar Merkezi'nde etkinliğimiz var. 1.000 sandalye, 100 masa, 20 televizyon ve 10 mini buzdolabına ihtiyacımız var."
  );
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/parse-rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (res.ok) {
        const parsed = await res.json();
        if (typeof window !== "undefined") {
          sessionStorage.setItem("prefilled_rfq", JSON.stringify(parsed));
        }
        router.push("/rfq/new?from_ai=true");
      } else {
        router.push("/rfq/new");
      }
    } catch (err) {
      console.error(err);
      router.push("/rfq/new");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full overflow-x-hidden pb-8 sm:pb-12">
      {/* 1. HERO SECTION (Dark Hero with Search & AI RFQ Card) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 via-slate-900 to-slate-900 text-white pt-8 pb-10 sm:pt-14 sm:pb-16 px-3 sm:px-6 lg:px-8 w-full">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-brand-500 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-4 sm:space-y-6 w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[11px] sm:text-xs font-semibold backdrop-blur-md max-w-full">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
            <span className="truncate">Türkiye&apos;nin İlk Kurumsal B2B Ekipman Kiralama Pazaryeri</span>
          </div>

          {/* Main Hero Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-snug sm:leading-tight px-1">
            İhtiyacınız olan ekipmanı{" "}
            <span className="bg-gradient-to-r from-brand-400 via-blue-300 to-teal-300 bg-clip-text text-transparent">
              satın almayın.
            </span>{" "}
            Tedarila ile kiralayın.
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed px-2">
            Fuar, etkinlik, şantiye ve geçici operasyonlarınız için binlerce kurumsal ekipmana tek tıkla ulaşın. Zaman bazlı stok garantisi ve akıllı çoklu tedarikçi eşleştirmesi.
          </p>

          {/* Compact / Dual Hero Search Box */}
          <div className="pt-2 w-full">
            <HeroSearch />
          </div>

          {/* AI Quick RFQ Card */}
          <div className="max-w-2xl mx-auto pt-2 px-1">
            <div className="p-3.5 sm:p-5 bg-slate-800/85 border border-slate-700/80 rounded-2xl sm:rounded-3xl backdrop-blur-md shadow-xl text-left space-y-2.5">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>DOĞAL DİLDE KİRALAMA TALEBİ OLUŞTURUN (AI RFQ)</span>
              </div>
              <form onSubmit={handleAiParse} className="space-y-2 sm:space-y-0 sm:flex sm:gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="İhtiyacınızı serbest metin olarak yazın..."
                  className="w-full flex-1 bg-slate-950/90 border border-slate-700 text-slate-100 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:border-brand-400"
                />
                <button
                  type="submit"
                  disabled={isAiLoading}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 flex-shrink-0 shadow-md shadow-amber-500/20"
                >
                  {isAiLoading ? "Ayrıştırılıyor..." : "AI ile RFQ Aç"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NASIL ÇALIŞIR? 4-STEP PROCESS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="text-center space-y-1.5 mb-6 sm:mb-8">
          <span className="text-[11px] sm:text-xs font-extrabold text-brand-600 uppercase tracking-widest">
            KOLAY & GÜVENİLİR SÜREÇ
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900">
            Nasıl Çalışır?
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
            Satın alma bütçenizi tüketmeden 4 adımda ihtiyacınız olan ekipmanı işinizin başında görün.
          </p>
        </div>

        {/* 4 Cards Grid: 2x2 on mobile, 4 in a row on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 01 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs sm:text-sm">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">İhtiyacını Belirle</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Tarih, adet ve teslimat lokasyonunu seçin veya doğrudan arama yapın.
            </p>
          </div>

          {/* Card 02 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs sm:text-sm">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Teklifleri Gör</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Gelen teklifleri ve çoklu tedarikçi kombinasyonlarını inceleyin.
            </p>
          </div>

          {/* Card 03 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs sm:text-sm">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Güvenle Kirala</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Stok rezervasyonunuz anında bloke edilir, sipariş kesinleşir.
            </p>
          </div>

          {/* Card 04 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs sm:text-sm">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Kullan ve İade Et</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Teslim tutanağı ile teslim alın, bitiminde iade edin.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
