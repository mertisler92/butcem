import { OrderStatus } from "@/types";

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  REQUESTED: ["QUOTE_ACCEPTED", "CANCELLED"],
  QUOTE_ACCEPTED: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["RETURN_PENDING"],
  RETURN_PENDING: ["RETURNED"],
  RETURNED: ["INSPECTING", "COMPLETED"],
  INSPECTING: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string; description: string }> = {
  REQUESTED: {
    label: "Talep Oluşturuldu",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Kiralama talebi tedarikçiye iletildi.",
  },
  QUOTE_ACCEPTED: {
    label: "Teklif Kabul Edildi",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    description: "Tedarikçinin teklifi onaylandı, ödeme aşamasına geçiliyor.",
  },
  PAYMENT_PENDING: {
    label: "Ödeme Bekleniyor",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Kiralama bedeli ve depozito teminatı bekleniyor.",
  },
  CONFIRMED: {
    label: "Rezervasyon Onaylandı",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Ödeme alındı, stok bloke edildi ve sipariş kesinleşti.",
  },
  PREPARING: {
    label: "Teslimata Hazırlanıyor",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Ekipmanlar kontrol ediliyor ve sevkiyata hazırlanıyor.",
  },
  DELIVERED: {
    label: "Teslim Edildi",
    color: "bg-teal-50 text-teal-700 border-teal-200",
    description: "Ekipman teslim tutanağı ve fotoğraflarla teslim edildi.",
  },
  ACTIVE: {
    label: "Kiralama Devam Ediyor",
    color: "bg-green-50 text-green-700 border-green-200",
    description: "Ekipman kiracı kullanımında aktif durumda.",
  },
  RETURN_PENDING: {
    label: "İade Bekleniyor",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    description: "Kiralama süresi dolmak üzere, iade lojistiği başlatıldı.",
  },
  RETURNED: {
    label: "İade Edildi",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    description: "Ekipman depoya teslim alındı.",
  },
  INSPECTING: {
    label: "Kontrol Ediliyor / Hasar İnceleme",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    description: "İade edilen ekipmanın hasar ve eksik kontrolü yapılıyor.",
  },
  COMPLETED: {
    label: "Tamamlandı",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    description: "Kiralama tamamlandı, depozito iade edildi.",
  },
  CANCELLED: {
    label: "İptal Edildi",
    color: "bg-red-50 text-red-700 border-red-200",
    description: "Sipariş iptal edildi ve stok blokajı kaldırıldı.",
  },
};

export function canTransitionOrder(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
  const allowed = ORDER_STATUS_FLOW[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}
