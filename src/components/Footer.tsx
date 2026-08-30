"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                <img
                  src="/images/tedarila_logo.jpg"
                  alt="Tedarila Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                Tedar<span className="text-brand-500">ila</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Türkiye&apos;nin ilk ve en gelişmiş B2B kurumsal ekipman kiralama ve tedarik pazaryeri.
            </p>
            <div className="flex items-center space-x-2 text-[10px] text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Güvenli Kurumsal Kiralama Altyapısı</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Ekipman Kataloğu
                </Link>
              </li>
              <li>
                <Link href="/rfq/new" className="hover:text-white transition-colors">
                  Akıllı Talep (AI RFQ)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/tenant" className="hover:text-white transition-colors">
                  Kiracı Paneli
                </Link>
              </li>
              <li>
                <Link href="/dashboard/supplier" className="hover:text-white transition-colors">
                  Tedarikçi Paneli
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Kategoriler
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products?category=etkinlik-organizasyon" className="hover:text-white transition-colors">
                  Etkinlik & Organizasyon
                </Link>
              </li>
              <li>
                <Link href="/products?category=fuar-stand" className="hover:text-white transition-colors">
                  Fuar & Stand Sistemleri
                </Link>
              </li>
              <li>
                <Link href="/products?category=endustriyel-mutfak" className="hover:text-white transition-colors">
                  Endüstriyel Mutfak
                </Link>
              </li>
              <li>
                <Link href="/products?category=teknoloji" className="hover:text-white transition-colors">
                  Teknoloji & Görsel Sistemler
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              İletişim & Destek
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-brand-500" />
                <span>destek@tedarila.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-brand-500" />
                <span>+90 (212) 800 00 00</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                <span>Maslak, Sarıyer / İstanbul</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>© 2026 Tedarila B2B Equipment Rental & Supply A.Ş. Tüm hakları saklıdır.</div>
          <div className="flex space-x-4">
            <span className="hover:text-slate-400 cursor-pointer">Gizlilik Politikası</span>
            <span className="hover:text-slate-400 cursor-pointer">Kullanım Koşulları</span>
            <span className="hover:text-slate-400 cursor-pointer">KVKK Aydınlatma Metni</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
