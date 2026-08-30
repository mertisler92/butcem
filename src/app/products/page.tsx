"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  X,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "@/lib/demo-data";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>(DEMO_PRODUCTS);
  const [categories, setCategories] = useState<any[]>(DEMO_CATEGORIES);
  const [loading, setLoading] = useState(false);

  // Mobile filter drawer toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter states
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [city, setCity] = useState(searchParams.get("city") || "Tüm Şehirler");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [quantity, setQuantity] = useState(searchParams.get("quantity") || "1");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verifiedOnly") === "true");
  const [deliveryOnly, setDeliveryOnly] = useState(searchParams.get("deliveryOnly") === "true");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "recommended");

  // Load Categories
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCats();
  }, []);

  // Fetch Products based on current filters
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        if (selectedCategory) params.set("category", selectedCategory);
        if (city && city !== "Tüm Şehirler") params.set("city", city);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (quantity) params.set("quantity", quantity);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        if (verifiedOnly) params.set("verifiedOnly", "true");
        if (deliveryOnly) params.set("deliveryOnly", "true");
        if (sortBy) params.set("sortBy", sortBy);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [
    query,
    selectedCategory,
    city,
    startDate,
    endDate,
    quantity,
    minPrice,
    maxPrice,
    verifiedOnly,
    deliveryOnly,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCategory("");
    setCity("Tüm Şehirler");
    setStartDate("");
    setEndDate("");
    setQuantity("1");
    setMinPrice("");
    setMaxPrice("");
    setVerifiedOnly(false);
    setDeliveryOnly(false);
    setSortBy("recommended");
    router.push("/products");
  };

  const FilterBody = () => (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
          <Filter className="w-4 h-4 text-brand-600" />
          <span>Filtreler</span>
        </div>
        <button
          onClick={handleResetFilters}
          className="text-xs text-slate-400 hover:text-brand-600 font-medium flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Sıfırla
        </button>
      </div>

      {/* Search Keyword */}
      <div className="space-y-1">
        <label className="font-bold text-slate-600">Arama</label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün veya marka ara..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-1">
        <label className="font-bold text-slate-600">Kategori</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
        >
          <option value="">Tüm Kategoriler</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div className="space-y-1">
        <label className="font-bold text-slate-600">Lokasyon</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
        >
          <option value="Tüm Şehirler">Tüm Şehirler</option>
          <option value="İstanbul">İstanbul</option>
          <option value="Ankara">Ankara</option>
          <option value="İzmir">İzmir</option>
          <option value="Antalya">Antalya</option>
          <option value="Bursa">Bursa</option>
        </select>
      </div>

      {/* Date Range & Quantity */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="font-bold text-slate-600 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          <span>Tarih & Adet Bazlı Stok</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold">Başlangıç</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-medium"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold">Bitiş</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-medium"
            />
          </div>
        </div>

        <div className="mt-1">
          <span className="text-[10px] text-slate-400 font-semibold">İhtiyaç Adedi</span>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
          />
          <span className="font-semibold text-slate-700">Sadece Doğrulanmış Tedarikçiler</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={deliveryOnly}
            onChange={(e) => setDeliveryOnly(e.target.checked)}
            className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
          />
          <span className="font-semibold text-slate-700">Tedarikçi Teslimatı Olanlar</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 overflow-x-hidden">
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900">
            Ekipman Kataloğu
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {startDate && endDate ? (
              <span className="font-semibold text-brand-600">
                Seçilen tarihler ({startDate} - {endDate}) ve {quantity} adet için müsait ürünler listeleniyor.
              </span>
            ) : (
              "Türkiye genelindeki profesyonel kiralama ekipmanları"
            )}
          </p>
        </div>

        {/* Mobile Filter Toggle Button + Sort */}
        <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Filter className="w-3.5 h-3.5 text-brand-600" />
            <span>Filtrele</span>
          </button>

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:block">
              Sırala:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="recommended">Önerilen</option>
              <option value="price_asc">Fiyat: Düşük</option>
              <option value="price_desc">Fiyat: Yüksek</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Left Sidebar Filters (Desktop) */}
        <div className="hidden lg:block lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm h-fit">
          <FilterBody />
        </div>

        {/* Right Products Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 sm:h-72 bg-slate-200 rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Seçilen kriterlere uygun ekipman bulunamadı
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Filtrelerinizi gevşetebilir veya doğrudan kiralama talebi (RFQ) oluşturabilirsiniz.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl"
                >
                  Sıfırla
                </button>
                <button
                  onClick={() => router.push("/rfq/new")}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl"
                >
                  Talep Oluştur
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  startDate={startDate}
                  endDate={endDate}
                  quantity={parseInt(quantity, 10) || 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal Bottom Sheet with z-[60] and extra bottom padding */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden bg-slate-950/75 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full bg-white rounded-t-3xl p-5 pb-8 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Katalog Filtreleri</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            
            <FilterBody />
            
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-black text-sm rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
              >
                <span>Filtreleri Uygula ({products.length} Ürün)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Katalog yükleniyor...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
