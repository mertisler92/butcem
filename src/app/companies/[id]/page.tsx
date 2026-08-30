"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Building2,
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Layers,
} from "lucide-react";

export async function generateStaticParams() {
  return [
    { id: "comp_abc" },
    { id: "comp_mega" },
    { id: "comp_pro" },
    { id: "cmtg4fuer0008cgysk1lz12mz" },
    { id: "cmtg4fuer0009cgysk2lz13mz" },
    { id: "cmtg4fuer000acgysk3lz14mz" },
  ];
}

export default function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await fetch(`/api/companies?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setCompany(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadCompany();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-semibold">Şirket profili yükleniyor...</div>;
  }

  if (!company) {
    return (
      <div className="p-12 text-center space-y-3">
        <h3 className="text-xl font-bold text-slate-800">Şirket bulunamadı</h3>
        <Link href="/products" className="text-brand-600 font-bold">Kataloğa Dön</Link>
      </div>
    );
  }

  const profile = company.supplierProfile;
  const products = company.products || [];
  const reviews = company.receivedReviews || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-brand-500/20 flex-shrink-0">
              {company.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {company.name}
                </h1>
                {profile?.isVerified && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Doğrulanmış Tedarikçi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {company.companyType} • {company.taxOffice} ({company.taxNumber})
              </p>
            </div>
          </div>

          {profile && (
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Değerlendirme Puanı</div>
                <div className="text-2xl font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <span>{profile.rating}</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Tamamlanan Kiralama</div>
                <div className="text-2xl font-black text-emerald-600 mt-0.5">
                  {profile.completedRentals}+
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact & Location Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>{company.address}, {company.city}</span>
          </div>
          {company.website && (
            <div className="flex items-center gap-2 text-slate-600">
              <Globe className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <a href={company.website} target="_blank" rel="noreferrer" className="hover:underline">
                {company.website}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>Ortalama Yanıt Süresi: ~{profile?.responseTimeMinutes || 30} dakika</span>
          </div>
        </div>

        {profile?.description && (
          <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
            {profile.description}
          </p>
        )}
      </div>

      {/* Supplier Products Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Tedarikçinin Kiralık Ekipmanları ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
            Bu tedarikçinin şu an yayında olan ürünü bulunmuyor.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={{ ...product, supplierCompany: company }} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900">
            Müşteri Değerlendirmeleri & Yorumlar ({reviews.length})
          </h3>
          <div className="space-y-4">
            {reviews.map((r: any) => (
              <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-800">{r.reviewerCompany?.name || "Kurumsal Kiracı"}</div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{r.overallRating} / 5</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                <div className="text-[10px] text-slate-400">{formatDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
