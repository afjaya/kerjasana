import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tipe data sederhana untuk parameter fungsi
interface JobData {
  id: string;
  title: string;
  company: string;
  contact?: string;
  postedByName?: string;
  category?: string;
  salary?: string;
  location?: string;
  expiresAt?: Date | string;
}

interface UserData {
  name?: string;
  email?: string;
}

let testAccountPromise: Promise<nodemailer.TestAccount> | null = null;
import { getErrorMessage } from "./getErrorMessage";

async function getTransporter(): Promise<nodemailer.Transporter> {
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
      auth: { user, pass }
    });
  }

  // Fallback: Ethereal Fake SMTP untuk Testing
  try {
    console.log("[Email] SMTP Mandiri tidak ditemukan. Menggunakan Akun Testing Ethereal...");
    if (!testAccountPromise) {
      testAccountPromise = nodemailer.createTestAccount();
    }
    const testAccount = await testAccountPromise;
    console.log(`[Email] Akun Ethereal Aktif: ${testAccount.user}`);
    
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
    console.warn("[Email] Gagal membuat akun Ethereal:", err);
    throw err;
  }
}

export async function sendApprovalNotification(job: JobData, posterUser?: UserData) {
  const recipientEmail = posterUser?.email || job.contact || "no-reply@kerjasana.com";
  const recipientName = posterUser?.name || job.postedByName || "HRD Mitra";
  const subject = `Selamat! Lowongan "${job.title}" Anda telah Disetujui & Mulai Tayang 🎉`;

  // Safely format Expiration Date
  const formattedExpireDate = job.expiresAt
    ? new Date(job.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "30 Hari ke depan";

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
            <td style="padding: 6px 0; font-weight: 500; color: #0f172a;">: ${job.salary || "Sesuai kesepakatan"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Lokasi Penempatan</td>
            <td style="padding: 6px 0; font-weight: 500; color: #334155;">: ${job.location || "Indonesia"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0 6px 0; font-weight: 600; color: #64748b; border-top: 1px dashed #e2e8f0;">Status Tayang</td>
            <td style="padding: 8px 0 6px 0; font-weight: 800; color: #16a34a; border-top: 1px dashed #e2e8f0;">: ACTIVE (Tayang)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Masa Kadaluarsa</td>
            <td style="padding: 6px 0; font-weight: 700; color: #e11d48;">: s.d. ${formattedExpireDate}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${process.env.APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);">Lihat Detail Lowongan</a>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 18px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
        <p style="margin: 0;">Email ini dikirimkan secara otomatis oleh sistem Kerjasana.</p>
        <p style="margin: 4px 0 0 0;">&copy; 2026 Kerjasana Platform. Hak Cipta Dilindungi.</p>
      </div>
    </div>
  `;

  let status = "FAILED";
  let etherealUrl: string | undefined = undefined;

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
    status = "SENT";

    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      etherealUrl = testUrl;
      console.log(`[Email] [PREVIEW ETHEREAL] -> ${etherealUrl}`);
    }
  } catch (error: unknown) {
    console.error("[Email] Gagal mengirim email:", getErrorMessage(error));
  }

  // Jika tabel EmailNotification ada di schema.prisma, kamu bisa aktifkan ini:
  /*
  const log = await prisma.emailNotification.create({
    data: {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      recipientEmail,
      recipientName,
      subject,
      status,
      etherealUrl
    }
  });
  return log;
  */

  return { recipientEmail, status, etherealUrl };
}