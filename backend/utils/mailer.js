const nodemailer = require('nodemailer');

const port = parseInt(process.env.SMTP_PORT || '587');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: port,
  // 🔴 PENTING: secure harus false untuk port 587, true hanya untuk port 465
  secure: port === 465, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(targetEmail, userName, token) {
  const verifyLink = `${process.env.APP_URL || 'https://kerjasana.onrender.com'}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Kerjasana.com" <${process.env.SMTP_USER}>`,
    to: targetEmail,
    subject: "Konfirmasi & Verifikasi Akun Kerjasana.com Anda",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #059669; margin: 0;">Kerjasana<span style="color: #0f172a;">.com</span></h1>
        </div>
        <h2 style="color: #0f172a;">Halo, ${userName}! 👋</h2>
        <p style="color: #475569; line-height: 1.6;">
          Terima kasih telah mendaftar di <strong>Kerjasana.com</strong>. Tinggal satu langkah lagi untuk mengaktifkan akun Anda! Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: bold; border-radius: 8px; display: inline-block;">
            Verifikasi Email Saya
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">
          Atau salin tautan berikut di browser Anda:<br>
          <a href="${verifyLink}" style="color: #059669;">${verifyLink}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Jika Anda tidak merasa mendaftar di Kerjasana.com, abaikan email ini.
        </p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };