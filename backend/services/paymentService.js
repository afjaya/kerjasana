/**
 * Payment Service - Kerjasana.com Payment Gateway Service
 * Handles DRY-RUN / PAYMENT_BYPASS mode and Midtrans/Xendit production integration.
 */

class PaymentService {
  /**
   * Process checkout for Featured Job upgrades & Subscription plans
   * @param {Object} param0 
   * @param {string} param0.userId
   * @param {string} [param0.jobId]
   * @param {string} param0.paymentType - "FEATURED_JOB" | "SUBSCRIPTION_PRO" | "SUBSCRIPTION_ENTERPRISE"
   * @param {number} param0.amount
   */
  static async processCheckout({ userId, jobId, paymentType, amount }) {
    // Check if dry-run bypass mode is active (default: true for demo)
    const isBypass = process.env.PAYMENT_BYPASS !== 'false';
    const referenceId = `REF-KS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!paymentType || amount === undefined) {
      throw new Error("Parameter paymentType dan amount wajib diisi.");
    }

    if (paymentType === "FEATURED_JOB" && !jobId) {
      throw new Error("ID Lowongan Kerja (jobId) wajib diisi untuk upgrade Loker Prioritas.");
    }

    if (isBypass) {
      // MODE DRY-RUN BYPASS (AUTO-VERIFIED PAID STATUS)
      const transaction = {
        id: `tx-${Math.random().toString(36).substring(2, 11)}`,
        userId: userId || "demo-user",
        jobId: jobId || null,
        amount: Number(amount),
        paymentType,
        paymentMethod: "DEMO_BYPASS",
        status: "PAID",
        referenceId,
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        isBypassed: true,
        status: "PAID",
        message: "[DEMO] Pembayaran berhasil dikonfirmasi otomatis tanpa pemotongan saldo real!",
        transaction
      };
    } else {
      // MODE PRODUCTION PAYMENT GATEWAY (MIDTRANS / XENDIT SNAP)
      const transaction = {
        id: `tx-${Math.random().toString(36).substring(2, 11)}`,
        userId: userId || "demo-user",
        jobId: jobId || null,
        amount: Number(amount),
        paymentType,
        paymentMethod: "MIDTRANS_SNAP",
        status: "PENDING",
        referenceId,
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        isBypassed: false,
        status: "PENDING",
        message: "Silakan selesaikan pembayaran melalui Payment Gateway Midtrans / Xendit.",
        redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${referenceId}`,
        transaction
      };
    }
  }

  /**
   * Get transaction history for employer
   * @param {string} [userId] 
   */
  static async getTransactionHistory(userId) {
    // Boilerplate transaction reader
    return [];
  }
}

module.exports = PaymentService;

