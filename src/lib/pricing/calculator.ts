import { getRentalDays } from "@/lib/utils";
import { PricingBreakdown } from "@/types";

export interface PricingProductInput {
  dailyPrice: number;
  weeklyPrice?: number | null;
  monthlyPrice?: number | null;
  purchasePriceEstimate?: number | null;
  depositType?: "NONE" | "FIXED" | "PERCENTAGE";
  depositAmount?: number | null;
  depositPercent?: number | null;
  vatRate?: number;
  deliveryFee?: number;
  setupFee?: number;
  volumeDiscounts?: Array<{
    minQuantity: number;
    maxQuantity?: number | null;
    discountPercent: number;
  }>;
}

export function calculateRentalPricing(
  product: PricingProductInput,
  startDate: Date | string,
  endDate: Date | string,
  quantity: number = 1,
  includeDelivery: boolean = true,
  includeSetup: boolean = false
): PricingBreakdown {
  const days = getRentalDays(startDate, endDate);
  const dailyPrice = product.dailyPrice;
  const weeklyPrice = product.weeklyPrice;
  const monthlyPrice = product.monthlyPrice;

  // Calculate base unit rate based on optimal pricing strategy
  let appliedUnitRate = dailyPrice * days;
  let effectiveRateType: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY";

  // Optimization check 1: Weekly pricing
  if (weeklyPrice && weeklyPrice > 0) {
    const fullWeeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    const weeklyCombinedCost = fullWeeks * weeklyPrice + remainingDays * dailyPrice;
    
    // Also check if charging another full week is cheaper than remaining days
    const nextFullWeekCost = (fullWeeks + 1) * weeklyPrice;
    const bestWeeklyOption = Math.min(weeklyCombinedCost, nextFullWeekCost);

    if (bestWeeklyOption < appliedUnitRate) {
      appliedUnitRate = bestWeeklyOption;
      effectiveRateType = "WEEKLY";
    }
  }

  // Optimization check 2: Monthly pricing (30 days base)
  if (monthlyPrice && monthlyPrice > 0) {
    const fullMonths = Math.floor(days / 30);
    const remainingDays = days % 30;
    let remainderCost = remainingDays * dailyPrice;
    if (weeklyPrice) {
      const remWeeks = Math.floor(remainingDays / 7);
      const remDays = remainingDays % 7;
      remainderCost = Math.min(remainderCost, remWeeks * weeklyPrice + remDays * dailyPrice);
    }
    const monthlyCombinedCost = fullMonths * monthlyPrice + remainderCost;
    const nextFullMonthCost = (fullMonths + 1) * monthlyPrice;
    const bestMonthlyOption = Math.min(monthlyCombinedCost, nextFullMonthCost);

    if (bestMonthlyOption < appliedUnitRate) {
      appliedUnitRate = bestMonthlyOption;
      effectiveRateType = "MONTHLY";
    }
  }

  const baseDailyTotal = dailyPrice * days * quantity;
  const subtotal = appliedUnitRate * quantity;

  // Volume discount calculation
  let volumeDiscountPercent = 0;
  if (product.volumeDiscounts && product.volumeDiscounts.length > 0) {
    const matchingTier = product.volumeDiscounts
      .filter((tier) => quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity))
      .sort((a, b) => b.discountPercent - a.discountPercent)[0];

    if (matchingTier) {
      volumeDiscountPercent = matchingTier.discountPercent;
    }
  } else {
    // Default tier heuristic if not explicitly set
    if (quantity >= 500) volumeDiscountPercent = 15;
    else if (quantity >= 100) volumeDiscountPercent = 10;
    else if (quantity >= 50) volumeDiscountPercent = 5;
  }

  const volumeDiscountAmount = (subtotal * volumeDiscountPercent) / 100;
  const discountedSubtotal = subtotal - volumeDiscountAmount;

  // Fees
  const deliveryFee = includeDelivery ? (product.deliveryFee ?? 0) : 0;
  const setupFee = includeSetup ? (product.setupFee ?? 0) : 0;

  // Deposit calculation
  let depositAmount = 0;
  const depType = product.depositType ?? "NONE";
  if (depType === "FIXED") {
    depositAmount = (product.depositAmount ?? 0) * quantity;
  } else if (depType === "PERCENTAGE") {
    depositAmount = (discountedSubtotal * (product.depositPercent ?? 10)) / 100;
  }

  // VAT calculation (applied to rental subtotal + delivery + setup, but deposit is exempt as collateral)
  const vatRate = product.vatRate ?? 20.0;
  const taxableBase = discountedSubtotal + deliveryFee + setupFee;
  const vatAmount = (taxableBase * vatRate) / 100;

  const grandTotal = taxableBase + vatAmount + depositAmount;

  // Purchase cost comparison
  let estimatedPurchaseCost: number | null = null;
  let estimatedSavings: number | null = null;

  if (product.purchasePriceEstimate && product.purchasePriceEstimate > 0) {
    estimatedPurchaseCost = product.purchasePriceEstimate * quantity;
    estimatedSavings = Math.max(0, estimatedPurchaseCost - grandTotal);
  }

  return {
    rentalDays: days,
    quantity,
    unitDailyPrice: dailyPrice,
    baseDailyTotal,
    effectiveRateType,
    appliedUnitRate,
    subtotal,
    volumeDiscountPercent,
    volumeDiscountAmount,
    discountedSubtotal,
    deliveryFee,
    setupFee,
    depositAmount,
    vatRate,
    vatAmount,
    grandTotal,
    estimatedPurchaseCost,
    estimatedSavings,
  };
}
