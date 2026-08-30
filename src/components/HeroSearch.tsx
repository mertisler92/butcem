"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, MapPin, Hash, ArrowRight, X } from "lucide-react";
import { format, addDays } from "date-fns";

export default function HeroSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState("1000");
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 9), "yyyy-MM-dd"));
  const [city, setCity] = useState("İstanbul");

  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (quantity) params.set("quantity", quantity);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (city) params.set("city", city);

    setFilterModalOpen(false);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-1">
      {/* Sleek Search Trigger Bar (Matches User Screenshot 1 Exactly) */}
      <div
        onClick={() => setFilterModalOpen(true)}
        className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl shadow-black/20 border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3 sm:gap-4 truncate pr-2">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div className="text-left truncate">
            <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              {query || "Ekipman, şehir veya tarih ara..."}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
              {city} • {quantity} Adet • Tarih Seç
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSearch();
          }}
          className="px-5 sm:px-6 py-2.5 sm:py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center gap-1.5 flex-shrink-0 shadow-lg shadow-brand-500/25 transition-all"
        >
          <span>Ara</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Modal Drawer */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-left shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">Ekipman & Stok Arama</h3>
                <p className="text-xs text-slate-500">Tarih, adet ve şehir bazlı müsaitlik filtreleyin</p>
              </div>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Inputs Form */}
            <form onSubmit={handleSearch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ne Arıyorsunuz?</label>
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Search className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Örn: Sandalye, Masa, 65 inç TV..."
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">İhtiyaç Adedi</label>
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <Hash className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kiralama Tarih Aralığı</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Başlangıç</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none mt-0.5"
                    />
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Bitiş</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none mt-0.5"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Şehir / Lokasyon</label>
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="İstanbul">İstanbul</option>
                    <option value="Ankara">Ankara</option>
                    <option value="İzmir">İzmir</option>
                    <option value="Antalya">Antalya</option>
                    <option value="Bursa">Bursa</option>
                    <option value="Tüm Şehirler">Tüm Şehirler</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <Search className="w-4 h-4" />
                  <span>Uygun Ekipmanları Listele</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
