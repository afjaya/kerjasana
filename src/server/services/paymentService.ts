import { Database } from "../db";
import { PaymentType, Transaction } from "../../types";

export interface CheckoutInput {
  userId: string;
  jobId?: string;
  paymentType: PaymentType;
  amount: number;
}

export interface CheckoutResult {
  success: boolean;
  isBypassed: boolean;
  message: string;
  transaction?: Transaction;
  user?: any;
  job?: any;
  redirectUrl?: string;
}

export class PaymentService {
  public static async processCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const { userId, jobId, paymentType, amount } = input;
    
    // Cek environment variable PAYMENT_BYPASS (default true untuk demo)
    const isBypass = process.env.PAYMENT_BYPASS !== "false";

    const user = await Database.findUserById(userId);
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    if (paymentType === "FEATURED_JOB" && !jobId) {
      throw new Error("Job ID diperlukan untuk melakukan upgrade ke Featured Job.");
    }

    const referenceId = `REF-KS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isBypass) {
      // MODE DRY-RUN BYPASS (DEMO OTO-VERIFIED)
      let updatedJob = null;
      let updatedUser = null;

      // 1. Eksekusi Perubahan Bisnis
      if (paymentType === "FEATURED_JOB" && jobId) {
        updatedJob = await Database.upgradeJobToFeatured(jobId, 14);
      } else if (paymentType === "SUBSCRIPTION_PRO") {
        updatedUser = await Database.updateUserSubscription(userId, "PRO");
      } else if (paymentType === "SUBSCRIPTION_ENTERPRISE") {
        updatedUser = await Database.updateUserSubscription(userId, "ENTERPRISE");
      }

      // 2. Catat Data Transaksi
      const transaction = await Database.createTransaction({
        userId,
        jobId,
        amount,
        paymentType,
        paymentMethod: "DEMO_BYPASS",
        status: "PAID",
        referenceId
      });

      return {
        success: true,
        isBypassed: true,
        message: "[DEMO] Pembayaran berhasil dikonfirmasi otomatis!",
        transaction,
        user: updatedUser || user,
        job: updatedJob
      };
    } else {
      // MODE MIDTRANS / XENDIT PRODUCTION READY BOILERPLATE
      const transaction = await Database.createTransaction({
        userId,
        jobId,
        amount,
        paymentType,
        paymentMethod: "MIDTRANS_SNAP",
        status: "PENDING",
        referenceId
      });

      return {
        success: true,
        isBypassed: false,
        message: "Silakan lakukan pembayaran via Payment Gateway Midtrans / Xendit.",
        transaction,
        redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${referenceId}`
      };
    }
  }

  public static async getTransactionHistory(userId?: string): Promise<Transaction[]> {
    return Database.getTransactions(userId);
  }
}
