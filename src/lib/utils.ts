import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 ₺";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined, pattern: string = "d MMMM yyyy"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  try {
    return format(d, pattern, { locale: tr });
  } catch {
    return "-";
  }
}

export function formatShortDate(date: Date | string | null | undefined): string {
  return formatDate(date, "d MMM yyyy");
}

export function getRentalDays(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
  const days = differenceInCalendarDays(end, start);
  return Math.max(1, days <= 0 ? 1 : days);
}

export function generateOrderNumber(): string {
  const prefix = "KRP";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
}

export function generateRFQNumber(): string {
  const prefix = "RFQ";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
}

export function generateQuoteNumber(): string {
  const prefix = "TEK";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
}
