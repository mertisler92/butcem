import { PaymentProvider } from "@/types";

export interface PaymentExecutionResult {
  success: boolean;
  transactionId: string;
  provider: PaymentProvider;
  amount: number;
  message: string;
}

export interface CommissionCalculationResult {
  productTotal: number;
  deliveryFee: number;
  setupFee: number;
  taxableTotal: number;
  vatRate: number;
  vatAmount: number;
  depositAmount: number;
  grandTotal: number;
  commissionRate: number;
  commissionAmount: number;
  supplierPayout: number;
}

export class PaymentService {
  /**
   * Calculates financial breakdown including platform commission
   */
  static calculateOrderFinancials(params: {
    productTotal: number;
    deliveryFee?: number;
    setupFee?: number;
    depositAmount?: number;
    vatRate?: number;
    commissionRate?: number;
  }): CommissionCalculationResult {
    const {
      productTotal,
      deliveryFee = 0,
      setupFee = 0,
      depositAmount = 0,
      vatRate = 20.0,
      commissionRate = 10.0,
    } = params;

    const taxableTotal = productTotal + deliveryFee + setupFee;
    const vatAmount = (taxableTotal * vatRate) / 100;
    const grandTotal = taxableTotal + vatAmount + depositAmount;

    // Platform commission is calculated on the product total + services (excluding deposit and taxes)
    const commissionAmount = (taxableTotal * commissionRate) / 100;
    const supplierPayout = taxableTotal + vatAmount - commissionAmount;

    return {
      productTotal,
      deliveryFee,
      setupFee,
      taxableTotal,
      vatRate,
      vatAmount,
      depositAmount,
      grandTotal,
      commissionRate,
      commissionAmount,
      supplierPayout,
    };
  }

  /**
   * Process payment through selected provider
   */
  static async processPayment(params: {
    orderId: string;
    amount: number;
    provider: PaymentProvider;
    cardDetails?: {
      cardNumber?: string;
      cardHolder?: string;
      expiryMonth?: string;
      expiryYear?: string;
      cvv?: string;
    };
  }): Promise<PaymentExecutionResult> {
    const { orderId, amount, provider } = params;

    const txId = `TX-${provider.substring(0, 3)}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (provider === "SANDBOX") {
      return {
        success: true,
        transactionId: txId,
        provider: "SANDBOX",
        amount,
        message: "Sandbox test ödemesi başarıyla onaylandı.",
      };
    }

    if (provider === "BANK_TRANSFER") {
      return {
        success: true,
        transactionId: txId,
        provider: "BANK_TRANSFER",
        amount,
        message: "Havale/EFT dekont bildirimi alındı, muhasebe teyidi bekleniyor.",
      };
    }

    if (provider === "CARI") {
      return {
        success: true,
        transactionId: txId,
        provider: "CARI",
        amount,
        message: "Kurumsal cari hesap limiti üzerinden işlem onaylandı.",
      };
    }

    return {
      success: false,
      transactionId: txId,
      provider,
      amount,
      message: "Bilinmeyen ödeme yöntemi.",
    };
  }
}
