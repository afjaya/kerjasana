import nodemailer from "nodemailer";
import { Job, User, EmailNotification } from "../../types";
import { Database } from "../db";

let testAccountPromise: Promise<any> | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  // 1. Cek konfigurasi SMTP mandiri dari environment variables
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log(`[Email] Menggunakan Transporter SMTP Mandiri: ${host}:${port}`);
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
  }

  // 2. Jika tidak dikonfigurasi, gunakan real Ethereal SMTP untuk simulasi pengiriman yang menghasilkan link box email nyata!
  try {
    console.log("[Email] SMTP Mandiri tidak ditemukan di env. Mencoba membuat akun testing Ethereal...");
    if (!testAccountPromise) {
      testAccountPromise = nodemailer.createTestAccount();
    }
    const testAccount = await testAccountPromise;
    console.log(`[Email] Berhasil inisialisasi Akun Ethereal: User: ${testAccount.user}`);
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    console.warn("[Email] Gagal membuat akun Ethereal, menggunakan logger lokal fallback.", err);
    throw err;
  }
}

export async function sendApprovalNotification(job: Job, posterUser?: User): Promise<EmailNotification> {
  // Ambil email tujuan (prioritas email akun pembuat, atau contact lowongan)
  const recipientEmail = posterUser?.email || job.contact;
  const recipientName = posterUser?.name || job.postedByName || "HRD Mitra";
  const subject = `Selamat! Lowongan "${job.title}" Anda telah Disetujui & Mulai Tayang 🎉`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #f1f5f9; border-radius: 24px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);">
      <div style="text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.03em;">KERJASANA</h1>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #6366f1; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em;">Portal Lowongan Kerja Terpercaya & Terverifikasi</p>
      </div>
      
      <div style="margin-bottom: 24px;">
        <p style="font-size: 16px; font-weight: 700; margin: 0 0 10px 0; color: #0f172a;">Halo ${recipientName},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">Kabar gembira! Tim Moderator Kerjasana telah memeriksa dan <strong>menyetujui (APPROVED)</strong> iklan lowongan kerja yang Anda ajukan. Mulai saat ini, lowongan Anda sudah aktif dan tayang secara luas di halaman utama kami.</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b;">Detail Informasi Lowongan:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b; width: 35%;">Posisi Pekerjaan</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">: ${job.title}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Perusahaan</td>
            <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">: ${job.company}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Kategori</td>
            <td style="padding: 6px 0; font-weight: 600; color: #4f46e5;">: ${job.category || "Lainnya"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Estimasi Gaji</td>
            <td style="padding: 6px 0; font-weight: 500; color: #0f172a;">: ${job.salary}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Lokasi Penempatan</td>
            <td style="padding: 6px 0; font-weight: 500; color: #334155;">: ${job.location}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0 6px 0; font-weight: 600; color: #64748b; border-top: 1px dashed #e2e8f0;">Status Tayang</td>
            <td style="padding: 8px 0 6px 0; font-weight: 800; color: #16a34a; border-top: 1px dashed #e2e8f0;">: ACTIVE (Tayang)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Masa Kadaluarsa</td>
            <td style="padding: 6px 0; font-weight: 700; color: #e11d48;">: s.d. ${new Date(job.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} (30 Hari)</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 28px;">
        <p style="font-size: 13px; color: #64748b; margin-bottom: 14px;">Silakan klik tombol di bawah untuk melihat tampilan lowongan kerja Anda di platform kami:</p>
        <a href="${process.env.APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25); transition: background-color 0.2s;">Lihat Detail Lowongan</a>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
        <p style="margin: 0;">Email ini dikirimkan secara otomatis oleh sistem Kerjasana karena Anda terdaftar sebagai pengiklan lowongan tersebut.</p>
        <p style="margin: 4px 0 0 0;">&copy; 2026 Kerjasana Platform. Hak Cipta Dilindungi.</p>
      </div>
    </div>
  `;

  const emailLog: Omit<EmailNotification, "id" | "sentAt"> = {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    recipientEmail,
    recipientName,
    subject,
    html,
    status: "FAILED"
  };

  try {
    const transporter = await getTransporter();
    const from = process.env.SMTP_FROM || "no-reply@kerjasana.com";

    const info = await transporter.sendMail({
      from: `"Kerjasana Admin" <${from}>`,
      to: recipientEmail,
      subject,
      html
    });

    console.log(`[Email] Notifikasi terkirim ke ${recipientEmail}. MessageId: ${info.messageId}`);
    emailLog.status = "SENT";
    
    // Ambil link preview Ethereal nyata jika ada
    const etherealUrl = nodemailer.getTestMessageUrl(info);
    if (etherealUrl) {
      console.log(`[Email] [PREVIEW DI ETHEREAL] -> ${etherealUrl}`);
      emailLog.etherealUrl = etherealUrl;
    }
  } catch (error: any) {
    console.error("[Email] Gagal melakukan dispatch pengiriman email:", error);
    emailLog.status = "FAILED";
    emailLog.error = error.message || String(error);
  }

  // Simpan record ke DB agar Admin atau HRD bisa membukanya dari UI dashboard
  const loggedEmail = Database.logEmail(emailLog);
  return loggedEmail;
}
