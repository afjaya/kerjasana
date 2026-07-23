import express from "express";
import { requireAuth, requireEmployerOrAdmin, AuthenticatedRequest } from "../middleware/authMiddleware";
import { PaymentService } from "../services/paymentService";

const router = express.Router();

/**
 * POST /api/payments/checkout
 * Endpoint aman khusus HRD / Employer & Admin untuk memproses pembelian:
 * - Upgrade Loker ke FEATURED_JOB (Rp 50.000)
 * - Langganan Paket PRO (Rp 150.000)
 * - Langganan Paket ENTERPRISE (Rp 450.000)
 */
router.post("/payments/checkout", requireAuth, requireEmployerOrAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId, paymentType, amount } = req.body;

    if (!paymentType || amount === undefined) {
      return res.status(400).json({ 
        error: "Data transaksi tidak lengkap. 'paymentType' dan 'amount' wajib diisi." 
      });
    }

    if (paymentType === "FEATURED_JOB" && !jobId) {
      return res.status(400).json({ 
        error: "ID Lowongan Kerja (jobId) wajib diisi untuk upgrade Loker Prioritas." 
      });
    }

    const userId = req.user!.id;

    const result = await PaymentService.processCheckout({
      userId,
      jobId,
      paymentType,
      amount: Number(amount)
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Payment checkout error:", error);
    return res.status(400).json({ 
      error: error.message || "Gagal memproses transaksi pembayaran." 
    });
  }
});

/**
 * GET /api/payments/history
 * Endpoint bagi HRD / Employer untuk melihat riwayat transaksi pembayaran mereka
 */
router.get("/payments/history", requireAuth, requireEmployerOrAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.role === "ADMIN" ? undefined : req.user!.id;
    const transactions = await PaymentService.getTransactionHistory(userId);

    return res.status(200).json({
      transactions
    });
  } catch (error: any) {
    console.error("Get payment history error:", error);
    return res.status(500).json({ 
      error: "Gagal mengambil riwayat transaksi pembayaran." 
    });
  }
});

export default router;
