export type Role = "ADMIN" | "USER";
export type CompanyStatus = "UNVERIFIED" | "IN_REVIEW" | "VERIFIED" | "SUSPENDED";
export type CompanyMemberRole = "OWNER" | "MANAGER" | "MEMBER";
export type DepositType = "NONE" | "FIXED" | "PERCENTAGE";
export type DeliveryOption = "TENANT_PICKUP" | "SUPPLIER_DELIVERS" | "FREIGHT_REQUIRED";
export type SetupOption = "NONE" | "OPTIONAL" | "INCLUDED";
export type ProductCondition = "NEW" | "LIKE_NEW" | "GOOD" | "USED";
export type BlockReason = "MAINTENANCE" | "RESERVED" | "MANUAL_BLOCK";
export type RFQStatus = "DRAFT" | "OPEN" | "QUOTED" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
export type QuoteStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type OrderStatus =
  | "REQUESTED"
  | "QUOTE_ACCEPTED"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "DELIVERED"
  | "ACTIVE"
  | "RETURN_PENDING"
  | "RETURNED"
  | "INSPECTING"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";
export type PaymentProvider = "SANDBOX" | "BANK_TRANSFER" | "CARI";
export type DepositStatus = "HELD" | "RELEASED" | "DEDUCTED_FOR_DAMAGE";
export type ProtocolType = "DELIVERY" | "RETURN";
export type DamageClaimStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RESOLVED";
export type ReviewRole = "SUPPLIER_TO_TENANT" | "TENANT_TO_SUPPLIER";

export interface SearchFilterParams {
  query?: string;
  category?: string;
  subCategory?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  quantity?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  deliveryOnly?: boolean;
  setupOnly?: boolean;
  verifiedOnly?: boolean;
  sortBy?: "recommended" | "price_asc" | "price_desc" | "rating_desc" | "stock_desc";
}

export interface PricingBreakdown {
  rentalDays: number;
  quantity: number;
  unitDailyPrice: number;
  baseDailyTotal: number;
  effectiveRateType: "DAILY" | "WEEKLY" | "MONTHLY";
  appliedUnitRate: number;
  subtotal: number;
  volumeDiscountPercent: number;
  volumeDiscountAmount: number;
  discountedSubtotal: number;
  deliveryFee: number;
  setupFee: number;
  depositAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  estimatedPurchaseCost: number | null;
  estimatedSavings: number | null;
}

export interface ParsedRFQItem {
  productName: string;
  quantity: number;
  categorySlug?: string;
  targetBudget?: number;
  notes?: string;
}

export interface ParsedRFQResult {
  title: string;
  city: string;
  address?: string;
  startDate: string;
  endDate: string;
  deliveryNeeded: boolean;
  setupNeeded: boolean;
  notes?: string;
  items: ParsedRFQItem[];
  confidence: number;
}

export interface SupplierAllocation {
  supplierCompanyId: string;
  supplierName: string;
  productId: string;
  productName: string;
  offeredQuantity: number;
  unitDailyPrice: number;
  deliveryFee: number;
  setupFee: number;
  subtotal: number;
  totalDays: number;
  lineTotal: number;
}

export interface MultiSupplierSolution {
  type: "SINGLE_SUPPLIER" | "MULTI_SUPPLIER";
  suppliersCount: number;
  isCompleteFulfillment: boolean;
  fulfilledQuantity: number;
  requestedQuantity: number;
  allocations: SupplierAllocation[];
  totalProductPrice: number;
  totalDeliveryFee: number;
  totalSetupFee: number;
  estimatedTotal: number;
}
