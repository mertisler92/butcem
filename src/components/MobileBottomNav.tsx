"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import {
  Home,
  Search,
  Sparkles,
  Package,
  UserCheck,
  ChevronUp,
  Building2,
  Layers,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { currentProfile, setProfileByKey, allProfiles } = useSession();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const isHome = pathname === "/";
  const isCatalog = pathname.startsWith("/products");
  const isRFQ = pathname.startsWith("/rfq");
  const isDashboard = pathname.startsWith("/dashboard");

  const dashboardHref =
    currentProfile.key.startsWith("supplier")
      ? "/dashboard/supplier"
      : "/dashboard/tenant";

  return (
    <>
      {/* Fixed Bottom Bar for Mobile (md:hidden) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around">
          {/* 1. Keşfet / Ana Sayfa */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              isHome
                ? "text-brand-600 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <Home className={`w-5 h-5 ${isHome ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10px] mt-0.5">Keşfet</span>
          </Link>

          {/* 2. Ekipman Kataloğu */}
          <Link
            href="/products"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              isCatalog
                ? "text-brand-600 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <Search className={`w-5 h-5 ${isCatalog ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10px] mt-0.5">Katalog</span>
          </Link>

          {/* 3. Akıllı RFQ (Highlighted CTA) */}
          <Link
            href="/rfq/new"
            className={`flex flex-col items-center justify-center -mt-4 py-1 px-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/30 transition-transform active:scale-95 ${
              isRFQ ? "ring-2 ring-amber-400" : ""
            }`}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <span className="text-[9px] font-extrabold text-white -mt-1 tracking-tight">
              Talep Aç
            </span>
          </Link>

          {/* 4. Panelim (Kiracı / Tedarikçi Dashboard) */}
          <Link
            href={dashboardHref}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
              isDashboard
                ? "text-brand-600 font-bold"
                : "text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <Package className={`w-5 h-5 ${isDashboard ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="text-[10px] mt-0.5">Panelim</span>
          </Link>

          {/* 5. Profil & Rol Switcher */}
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <div className="relative">
              <UserCheck className="w-5 h-5 stroke-[1.8]" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <span className="text-[10px] mt-0.5">Hesap</span>
          </button>
        </div>
      </nav>

      {/* Mobile Profile & Role Bottom Sheet */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-[60] md:hidden bg-slate-900/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full bg-white rounded-t-3xl p-6 pb-8 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Aktif Şirket / Rol</h3>
                <p className="text-xs text-slate-500">Demo test profilinizi seçin</p>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {allProfiles.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setProfileByKey(p.key);
                    setProfileModalOpen(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    p.key === currentProfile.key
                      ? "bg-brand-50 border-brand-500 text-brand-900 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-xs">{p.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{p.email}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${p.badgeColor}`}>
                    {p.roleText}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
