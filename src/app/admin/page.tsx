"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  PlusCircle,
  Settings,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"companies" | "claims" | "categories" | "orders">("companies");

  // Dispute resolution state
  const [disputeModalClaim, setDisputeModalClaim] = useState<any | null>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const loadAdminData = async () => {
    try {
      const [statsRes, compRes, catRes, ordRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/companies"),
        fetch("/api/categories"),
        fetch("/api/orders"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (compRes.ok) setCompanies(await compRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyCompany = async (companyId: string, status: string, isVerifiedSupplier: boolean) => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, isVerifiedSupplier }),
      });

      if (res.ok) {
        alert("Şirket statüsü güncellendi.");
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveClaim = async (claimId: string, resolutionStatus: "APPROVED" | "REJECTED") => {
    setIsResolving(true);
    try {
      const res = await fetch(`/api/admin/damage-claims/${claimId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: resolutionStatus === "APPROVED" ? "APPROVED" : "REJECTED",
          approvedAmount: resolutionStatus === "APPROVED" ? parseFloat(approvedAmount || "0") : 0,
          resolutionNotes: resolutionNotes || `${resolutionStatus === "APPROVED" ? "Hasar onaylandı ve depozitodan kesildi." : "Hasar talebi reddedildi."}`,
        }),
      });

      if (res.ok) {
        alert("Hasar uyuşmazlığı çözüldü ve depozito güncellendi.");
        setDisputeModalClaim(null);
        setApprovedAmount("");
        setResolutionNotes("");
        loadAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(false);
    }
  };

  // Collect all claims from orders
  const allClaims: any[] = [];
  orders.forEach((o) => {
    if (o.damageClaims && o.damageClaims.length > 0) {
      o.damageClaims.forEach((c: any) => {
        allClaims.push({ ...c, order: o });
      });
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Platform Yönetim Merkezi (Admin)
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Süper Yönetici
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Şirket onayları, komisyon oranları, uyuşmazlık çözümleri ve platform finansal metrikleri.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Platform GMV (İşlem Hacmi)</div>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.gmv)}</div>
            <div className="text-[11px] text-slate-500 font-medium">{stats.totalOrders} Toplam Sipariş</div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Platform Komisyon Geliri</div>
            <div className="text-2xl font-black text-brand-600">{formatCurrency(stats.platformRevenue)}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Net Tahakkuk Eden Komisyon
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Kayıtlı B2B Şirketler</div>
            <div className="text-2xl font-black text-slate-900">{stats.totalCompanies} Şirket</div>
            <div className="text-[11px] text-slate-500 font-medium">
              {stats.verifiedCompanies} Doğrulanmış • {stats.pendingCompanies} İnceleniyor
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Teklif → Sipariş Dönüşümü</div>
            <div className="text-2xl font-black text-indigo-600">{stats.quoteToOrderConversion}</div>
            <div className="text-[11px] text-slate-500 font-medium">RFQ başarı oranı</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab("companies")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "companies"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Şirket Doğrulama & Yönetim ({companies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("claims")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "claims"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>Hasar & Uyuşmazlık Masası ({allClaims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "categories"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Kategoriler & Komisyon Ayarları</span>
        </button>
      </div>

      {/* TAB 1: COMPANIES */}
      {activeTab === "companies" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Şirket Adı</th>
                  <th className="p-3.5">Vergi No / Dairesi</th>
                  <th className="p-3.5">Lokasyon</th>
                  <th className="p-3.5">Tür & Rol</th>
                  <th className="p-3.5">Durum</th>
                  <th className="p-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{company.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{company.email}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono">
                      <div>{company.taxNumber}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{company.taxOffice}</div>
                    </td>
                    <td className="p-3.5 text-slate-700">{company.city}</td>
                    <td className="p-3.5 text-slate-700">
                      {company.supplierProfile ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded">
                          Tedarikçi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                          Kiracı
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
                          company.status === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800"
                            : company.status === "SUSPENDED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {company.status === "VERIFIED"
                          ? "Doğrulandı"
                          : company.status === "SUSPENDED"
                          ? "Askıya Alındı"
                          : "İnceleniyor"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {company.status !== "VERIFIED" && (
                        <button
                          onClick={() => handleVerifyCompany(company.id, "VERIFIED", true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                        >
                          Doğrula & Onayla
                        </button>
                      )}
                      {company.status !== "SUSPENDED" && (
                        <button
                          onClick={() => handleVerifyCompany(company.id, "SUSPENDED", false)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg"
                        >
                          Askıya Al
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLAIMS & DISPUTES */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          {allClaims.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
              Şu anda açık bir hasar veya uyuşmazlık bildirimi bulunmuyor.
            </div>
          ) : (
            allClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Sipariş: {claim.order?.orderNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      Hasar Bildirimi — Talep Edilen: {formatCurrency(claim.claimedAmount)}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      claim.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : claim.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {claim.status === "APPROVED"
                      ? "Onaylandı & Kesinti Yapıldı"
                      : claim.status === "REJECTED"
                      ? "Reddedildi"
                      : "İnceleniyor"}
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-slate-800">Açıklama:</div>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {claim.description}
                  </p>
                </div>

                {claim.status === "SUBMITTED" && (
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => handleResolveClaim(claim.id, "REJECTED")}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl"
                    >
                      Talebi Reddet (Depozitoyu İade Et)
                    </button>
                    <button
                      onClick={() => {
                        setDisputeModalClaim(claim);
                        setApprovedAmount(claim.claimedAmount.toString());
                      }}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow"
                    >
                      Hasarı Onayla & Depozitodan Kes
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CATEGORIES & COMMISSIONS */}
      {activeTab === "categories" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">Kategori & Komisyon Yönetimi</h3>
              <p className="text-xs text-slate-500">
                Pazaryeri komisyon oranları hard-coded değildir, kategori bazında buradan yönetilir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                  <span className="px-2.5 py-1 bg-brand-100 text-brand-800 font-extrabold text-xs rounded-lg">
                    Komisyon: %{cat.commissionRate}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
                <div className="text-[11px] text-slate-400">
                  {cat.subCategories?.length || 0} Alt Kategori
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISPUTE RESOLUTION MODAL */}
      {disputeModalClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Hasar Tazminatını Onayla</h3>
            <p className="text-xs text-slate-500">
              Onaylanan tutar doğrudan sipariş depozitosundan kesilecek, kalan depozito kiracıya serbest bırakılacaktır.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Onaylanan Kesinti Tutarı (TL) *</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Karar Notu</label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Fotoğraflar ve teslim tutanağı incelenerek tutar onaylanmıştır."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDisputeModalClaim(null)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => handleResolveClaim(disputeModalClaim.id, "APPROVED")}
                disabled={isResolving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow"
              >
                {isResolving ? "İşleniyor..." : "Kesintiyi Onayla & Dosyayı Kapat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
