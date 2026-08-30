"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Star, ShieldCheck, CheckCircle2, TrendingDown, Layers } from "lucide-react";

interface ProductCardProps {
  product: any;
  startDate?: string;
  endDate?: string;
  quantity?: number;
}

export default function ProductCard({
  product,
  startDate,
  endDate,
  quantity = 1,
}: ProductCardProps) {
  const imageUrl =
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80";

  const supplier = product.supplierCompany;
  const rating = supplier?.supplierProfile?.rating || 5.0;
  const isVerified = supplier?.supplierProfile?.isVerified || false;

  const availableStock =
    product.calculatedAvailableStock !== undefined
      ? product.calculatedAvailableStock
      : product.totalStock;

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  if (quantity) queryParams.set("quantity", quantity.toString());

  const detailUrl = `/products/${product.id}${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Thumbnail & Badges */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Condition Tag */}
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
            {product.condition === "NEW"
              ? "Sıfır / Yeni"
              : product.condition === "LIKE_NEW"
              ? "Çok İyi Durumda"
              : "İyi Durumda"}
          </div>

          {/* Savings Badge */}
          {product.purchasePriceEstimate && (
            <div className="absolute bottom-3 left-3 bg-emerald-600/95 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Satın almaya göre %85+ tasarruf</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Category & Location */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="text-brand-600 font-semibold truncate max-w-[140px]">
              {product.category?.name || "Ekipman"}
            </span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{product.city}</span>
            </div>
          </div>

          {/* Title */}
          <Link href={detailUrl}>
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-brand-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Supplier Info */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 truncate max-w-[170px]">
              <span className="text-slate-700 font-medium truncate">
                {supplier?.name || "Tedarikçi"}
              </span>
              {isVerified && (
                <span title="Doğrulanmış Tedarikçi">
                  <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-700 font-bold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>{rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Stock Bottom Bar */}
      <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-slate-400 font-semibold uppercase">Günlük Fiyat</div>
          <div className="text-base font-extrabold text-slate-900">
            {formatCurrency(product.dailyPrice)}
            <span className="text-xs text-slate-400 font-normal"> / gün</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-slate-500 font-medium">
            {availableStock > 0 ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3 h-3" /> {availableStock.toLocaleString("tr-TR")} adet müsait
              </span>
            ) : (
              <span className="text-rose-600 font-semibold">Tükendi</span>
            )}
          </div>
          <Link
            href={detailUrl}
            className="mt-1 inline-block text-xs font-bold text-brand-600 hover:text-brand-700 underline underline-offset-2"
          >
            İncele & Kirala &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
