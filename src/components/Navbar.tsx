"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";
import {
  Sparkles,
  ChevronDown,
  PlusCircle,
} from "lucide-react";

export default function Navbar() {
  const { currentProfile, setProfileByKey, allProfiles } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-4 sm:space-x-8 flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-brand-500/20 flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform bg-white">
                <img
                  src="/images/tedarila_logo.jpg"
                  alt="Tedarila Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Tedar<span className="text-brand-600">ila</span>
                </span>
                <span className="hidden sm:block text-[9px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                  B2B RENTAL & SUPPLY
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/products"
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Ekipman Kataloğu
              </Link>
              <Link
                href="/rfq/new"
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Akıllı Talep (AI RFQ)
              </Link>
              <Link
                href="/dashboard/tenant"
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Kiracı Paneli
              </Link>
              <Link
                href="/dashboard/supplier"
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Tedarikçi Paneli
              </Link>
            </nav>
          </div>

          {/* Right Actions: Role Switcher & CTA */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Interactive Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] sm:text-xs font-semibold text-slate-700 transition-all shadow-sm max-w-[150px] sm:max-w-[220px]"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="truncate">
                  {currentProfile.title}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Demo Rolünü Değiştir
                  </div>
                  {allProfiles.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => {
                        setProfileByKey(p.key);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        p.key === currentProfile.key ? "bg-brand-50/70 font-bold text-brand-700" : "text-slate-700"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div>{p.title}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{p.email}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.badgeColor}`}>
                        {p.roleText}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RFQ CTA Button (Desktop only) */}
            <Link
              href="/rfq/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Talep Oluştur</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
