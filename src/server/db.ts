/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Job, EmailNotification, CandidateProfile, Application, ApplicationStatus, UserRole, Transaction, PaymentType, PaymentStatus, JobReport, JobReportReason, JobReportStatus } from "../types";
import { PrismaClient } from "@prisma/client";

// Inisialisasi Prisma Client tunggal untuk seluruh aplikasi
export const prisma = new PrismaClient();

function serializeUser(user: any): User {
  if (!user) return user;

  const { isEmailVerified, emailVerificationToken, ...rest } = user;
  return {
    ...rest,
    passwordHash: user.passwordHash,
    avatarUrl: undefined,
    isVerified: Boolean(isEmailVerified),
    verificationToken: emailVerificationToken ?? undefined,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt
  } as unknown as User;
}

function serializeJob(job: any): Job {
  if (!job) return job;

  return {
    ...job,
    postedByName: job.postedByUser?.name ?? job.postedByName ?? "",
    category: job.category ?? "Lainnya",
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : job.createdAt,
    expiresAt: job.expiresAt instanceof Date ? job.expiresAt.toISOString() : job.expiresAt,
    featuredUntil: job.featuredUntil instanceof Date ? job.featuredUntil.toISOString() : job.featuredUntil
  } as unknown as Job;
}

// Helper untuk tanggal (UTC+7 / Jakarta WIB friendly)
function getFutureDate(days: number, fromDate: Date = new Date()): string {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function getPastDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// Data Bawaan (Default Seed Data)
const DEFAULT_USERS = [
  {
    id: "user-admin",
    name: "Admin Kerjasana",
    email: "admin@kerjasana.com",
    role: "ADMIN" as const,
    subscriptionPlan: "ENTERPRISE",
    jobPostingQuota: 999,
    passwordHash: "admin123",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-hrd1",
    name: "Budi Setiawan (HRD Tokopedia)",
    email: "budi@tokopedia.com",
    role: "USER" as const,
    subscriptionPlan: "PRO",
    jobPostingQuota: 10,
    passwordHash: "owner123",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-hrd2",
    name: "Siti Rahma (Owner Kopi Kenangan)",
    email: "siti@kopikenangan.com",
    role: "USER" as const,
    subscriptionPlan: "FREE",
    jobPostingQuota: 2,
    passwordHash: "owner123",
    createdAt: new Date().toISOString()
  },
  {
    id: "user-candidate1",
    name: "Rian Pratama (Pelamar Web Dev)",
    email: "rian.candidate@gmail.com",
    role: "CANDIDATE" as const,
    subscriptionPlan: "FREE",
    jobPostingQuota: 0,
    passwordHash: "candidate123",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_JOBS: Job[] = [
  {
    id: "job-1",
    title: "Senior Full-Stack Developer",
    company: "Tokopedia",
    location: "Jakarta Selatan, DKI Jakarta",
    salary: "Rp 15.000.000 - Rp 22.000.000",
    salaryMin: 15000000,
    salaryMax: 22000000,
    salaryPeriod: "Bulan",
    description: "Kami mencari Senior Full-Stack Developer berpengalaman untuk memimpin tim frontend dan backend kami. Anda akan bertanggung jawab merancang arsitektur sistem berskala besar dan menulis kode yang bersih serta teruji.",
    requirements: "• Minimal 5 tahun pengalaman dengan React, Node.js, dan PostgreSQL.\n• Berpengalaman dengan RESTful API, GraphQL, dan Docker.\n• Kemampuan kepemimpinan yang baik dan terbiasa bekerja dalam tim Agile.\n• Memiliki kemauan belajar yang tinggi.",
    contact: "recruitment@tokopedia.com",
    status: "ACTIVE",
    postedBy: "user-hrd1",
    postedByName: "Budi Setiawan (HRD Tokopedia)",
    createdAt: getPastDate(5),
    expiresAt: getFutureDate(25),
    category: "IT / Teknologi"
  },
  {
    id: "job-2",
    title: "Store Manager",
    company: "Kopi Kenangan",
    location: "Kuta, Bali",
    salary: "Rp 6.000.000 - Rp 8.500.000",
    salaryMin: 6000000,
    salaryMax: 8500000,
    salaryPeriod: "Bulan",
    description: "Bertanggung jawab atas operasional harian outlet Kopi Kenangan, memastikan kepuasan pelanggan, mengelola stok bahan baku, serta mengawasi kinerja para barista untuk menjaga standar kualitas kopi terbaik.",
    requirements: "• Pengalaman minimal 2 tahun sebagai Supervisor/Manager di F&B.\n• Memiliki keahlian komunikasi yang prima dan kepemimpinan yang kuat.\n• Bersedia bekerja di akhir pekan dan hari libur nasional.\n• Domisili Bali lebih diutamakan.",
    contact: "bali.recruitment@kopikenangan.com",
    status: "PENDING",
    postedBy: "user-hrd2",
    postedByName: "Siti Rahma (Owner Kopi Kenangan)",
    createdAt: new Date().toISOString(),
    expiresAt: getFutureDate(30),
    category: "F&B / Pelayanan"
  },
  {
    id: "job-3",
    title: "Digital Marketing Specialist",
    company: "Creative Studio Bali",
    location: "Denpasar, Bali",
    salary: "Rp 5.000.000 - Rp 7.500.000",
    salaryMin: 5000000,
    salaryMax: 7500000,
    salaryPeriod: "Bulan",
    description: "Mengelola kampanye periklanan digital di Meta Ads, Google Ads, dan TikTok Ads. Menganalisis efektivitas promosi, merancang strategi konten bulanan, serta berkolaborasi dengan tim desain kreatif.",
    requirements: "• Menguasai Meta Business Suite dan Google Analytics.\n• Memiliki portofolio kampanye digital yang sukses.\n• Up-to-date dengan tren media sosial terbaru.\n• Memiliki sertifikasi Google Ads menjadi nilai tambah.",
    contact: "hr@creativestudio.id",
    status: "ACTIVE",
    postedBy: "user-hrd2",
    postedByName: "Siti Rahma (Owner Kopi Kenangan)",
    createdAt: getPastDate(15),
    expiresAt: getFutureDate(15),
    category: "Sales & Marketing"
  },
  {
    id: "job-4",
    title: "UI/UX Designer (Magang/Internship)",
    company: "TechInovasi",
    location: "Surabaya, Jawa Timur",
    salary: "Rp 2.500.000 - Rp 3.500.000",
    description: "Membantu perancangan wireframe, user flow, dan desain antarmuka aplikasi web dan mobile. Ini adalah kesempatan emas untuk belajar langsung dari para desainer senior dan membangun portofolio riil.",
    requirements: "• Mahir menggunakan Figma dan memahami dasar-dasar UI/UX.\n• Memiliki kemauan keras untuk belajar dan menerima feedback.\n• Melampirkan portofolio desain (meskipun proyek kuliah/pribadi).\n• Durasi magang minimal 3 bulan.",
    contact: "careers@techinovasi.co.id",
    status: "PENDING",
    postedBy: "user-hrd1",
    postedByName: "Budi Setiawan (HRD Tokopedia)",
    createdAt: new Date().toISOString(),
    expiresAt: getFutureDate(30),
    category: "Desain & Media"
  },
  {
    id: "job-5",
    title: "Barista Part-Time",
    company: "Kopi Kenangan",
    location: "Bandung, Jawa Barat",
    salary: "Rp 2.000.000 - Rp 3.000.000",
    description: "Meracik kopi dengan cinta, mengoperasikan mesin espresso, menjaga kebersihan area bar, dan melayani pelanggan dengan ramah serta senyuman hangat.",
    requirements: "• Terbuka untuk mahasiswa/i aktif.\n• Memiliki minat besar di dunia kopi.\n• Ramah, komunikatif, dan berpenampilan bersih.\n• Bersedia ditempatkan di Bandung.",
    contact: "bandung.recruitment@kopikenangan.com",
    status: "ACTIVE",
    postedBy: "user-hrd2",
    postedByName: "Siti Rahma (Owner Kopi Kenangan)",
    createdAt: getPastDate(35),
    expiresAt: getPastDate(5),
    category: "F&B / Pelayanan"
  },
  {
    id: "job-6",
    title: "Accounting & Finance Officer",
    company: "Bank BCA",
    location: "Jakarta Pusat, DKI Jakarta",
    salary: "Rp 8.000.000 - Rp 12.000.000",
    salaryMin: 8000000,
    salaryMax: 12000000,
    salaryPeriod: "Bulan",
    description: "Mengelola pembukuan keuangan harian, menyusun laporan laba rugi bulanan, menangani verifikasi pajak (PPN/PPh), serta melakukan rekonsiliasi bank.",
    requirements: "• Pendidikan minimal S1 Akuntansi / Keuangan.\n• Menguasai Accurate, SAP, atau Microsoft Excel tingkat lanjut (VLOOKUP, Pivot).\n• Teliti, memiliki integritas tinggi, dan berpengalaman minimal 2 tahun.",
    contact: "recruitment@bca.co.id",
    status: "ACTIVE",
    postedBy: "user-hrd1",
    postedByName: "Budi Setiawan (HRD Tokopedia)",
    createdAt: getPastDate(2),
    expiresAt: getFutureDate(28),
    category: "Keuangan & Akuntansi"
  },
  {
    id: "job-7",
    title: "Pengajar / Tutor Bahasa Inggris",
    company: "Lembaga Edukasi Prima",
    location: "Denpasar, Bali",
    salary: "Rp 4.500.000 - Rp 7.000.000",
    salaryMin: 4500000,
    salaryMax: 7000000,
    salaryPeriod: "Bulan",
    description: "Mengajar program Bahasa Inggris intensif untuk siswa sekolah dan profesional, menyusun materi pembelajaran interaktif, serta memberikan evaluasi perkembangan siswa.",
    requirements: "• Lulusan S1 Pendidikan Bahasa Inggris atau Sastra Inggris.\n• Memiliki skor TOEFL minimal 550 / IELTS 6.5.\n• Ramah, komunikatif, dan menyukai dunia pendidikan anak & dewasa.",
    contact: "hrd@edukasiprima.com",
    status: "ACTIVE",
    postedBy: "user-hrd2",
    postedByName: "Siti Rahma (Owner Kopi Kenangan)",
    createdAt: getPastDate(1),
    expiresAt: getFutureDate(29),
    category: "Pendidikan & Pelatihan"
  }
];

// ==========================================
// AUTH & USER OPERATIONS (PRISMA + SUPABASE)
// ==========================================

export class Database {
  private static emailLogs: EmailNotification[] = [];

  private static toIsoDate(value: Date | string | undefined): string | undefined {
    if (!value) return undefined;
    return value instanceof Date ? value.toISOString() : String(value);
  }

  public static async getUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
    return users.map((user) => serializeUser(user));
  }

  public static async findUserByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    return user ? serializeUser(user) : null;
  }

  public static async findUserById(id: string): Promise<User | null> {
    if (!id) return null;
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return user ? serializeUser(user) : null;
  }

  public static async findUserByVerificationToken(token: string): Promise<User | null> {
    if (!token) return null;
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });
    return user ? serializeUser(user) : null;
  }

  public static async verifyUserToken(token: string): Promise<User> {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw new Error("Token verifikasi email tidak valid atau telah kedaluwarsa.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date()
      }
    });

    return serializeUser(updatedUser);
  }

  public static async setVerificationToken(userId: string, token: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        isEmailVerified: false,
        updatedAt: new Date()
      }
    });

    return serializeUser(updatedUser);
  }

  public static async updateUserLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() }
    }).catch(() => null);
  }

  public static async createUser(
    name: string,
    email: string,
    passwordHash: string,
    role: UserRole = "USER",
    isVerified: boolean = true,
    verificationToken?: string
  ): Promise<User> {
    const exists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (exists) {
      throw new Error("Email sudah terdaftar");
    }

    const newUser = await prisma.user.create({
      data: {
        id: "user-" + Math.random().toString(36).substring(2, 11),
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role as any,
        subscriptionPlan: role === "ADMIN" ? "ENTERPRISE" : "FREE",
        jobPostingQuota: role === "ADMIN" ? 999 : (role === "CANDIDATE" || (role as string) === "APPLICANT" ? 0 : 2),
        isEmailVerified: isVerified,
        emailVerificationToken: verificationToken
      }
    });

    return serializeUser(newUser);
  }

  public static async updateUserSubscription(userId: string, plan: "PRO" | "ENTERPRISE"): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    const addedQuota = plan === "PRO" ? 10 : 50;
    const currentQuota = user.jobPostingQuota || 0;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        jobPostingQuota: currentQuota + addedQuota
      }
    });

    return serializeUser(updatedUser);
  }

  // ==========================================
  // PAYMENT & TRANSACTION OPERATIONS
  // ==========================================

  public static async createTransaction(txInput: {
    userId: string;
    jobId?: string;
    amount: number;
    paymentType: PaymentType;
    paymentMethod?: string;
    status?: PaymentStatus;
    referenceId: string;
  }): Promise<Transaction> {
    const user = await prisma.user.findUnique({ where: { id: txInput.userId } });
    const job = txInput.jobId ? await prisma.job.findUnique({ where: { id: txInput.jobId } }) : null;

    const newTx = await prisma.transaction.create({
      data: {
        id: "tx-" + Math.random().toString(36).substring(2, 11),
        userId: txInput.userId,
        jobId: txInput.jobId,
        amount: txInput.amount,
        paymentType: txInput.paymentType as any,
        paymentMethod: txInput.paymentMethod || "DEMO_BYPASS",
        status: (txInput.status || "PAID") as any,
        referenceId: txInput.referenceId
      }
    });

    return {
      ...newTx,
      jobTitle: job?.title,
      company: job?.company,
      userName: user?.name,
      userEmail: user?.email,
      createdAt: newTx.createdAt instanceof Date ? newTx.createdAt.toISOString() : newTx.createdAt
    } as unknown as Transaction;
  }

  public static async getTransactions(userId?: string): Promise<Transaction[]> {
    const whereCondition = userId ? { userId } : {};
    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      include: {
        user: true,
        job: true
      },
      orderBy: { createdAt: "desc" }
    });

    return transactions.map((tx) => {
      const txData = tx as any;
      return {
        ...(tx as unknown as Record<string, unknown>),
        createdAt: Database.toIsoDate(tx.createdAt as Date | string | undefined) ?? "",
        jobTitle: tx.job?.title ?? txData.jobTitle,
        company: tx.job?.company ?? txData.company,
        userName: tx.user?.name ?? txData.userName,
        userEmail: tx.user?.email ?? txData.userEmail
      } as unknown as Transaction;
    });
  }

  // ==========================================
  // JOB OPERATIONS
  // ==========================================

  public static async getJobs(): Promise<Job[]> {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" }
    });
    return jobs.map((job) => serializeJob(job));
  }

  public static async getActiveJobs(): Promise<Job[]> {
    const jobs = await prisma.job.findMany({
      where: { status: "ACTIVE" },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" }
      ]
    });
    return jobs.map((job) => serializeJob(job));
  }

  public static async findJobById(id: string | number): Promise<Job | undefined> {
    if (id === undefined || id === null) return undefined;
    const strId = String(id).trim();
    if (!strId) return undefined;

    // 1. Exact match
    let job = await prisma.job.findUnique({ where: { id: strId } });
    if (job) return serializeJob(job);

    // 2. Prefix 'job-' match
    const altId = strId.startsWith("job-") ? strId.replace("job-", "") : `job-${strId}`;
    job = await prisma.job.findUnique({ where: { id: altId } });
    if (job) return serializeJob(job);

    return undefined;
  }

  public static async createJob(jobData: Omit<Job, "id" | "status" | "createdAt" | "expiresAt">): Promise<Job> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const newJob = await prisma.job.create({
      data: {
        id: "job-" + Math.random().toString(36).substring(2, 11),
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        salary: jobData.salary,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        salaryPeriod: jobData.salaryPeriod,
        description: jobData.description,
        requirements: jobData.requirements,
        contact: jobData.contact,
        postedBy: jobData.postedBy,
        status: "PENDING",
        expiresAt
      }
    });

    return serializeJob({
      ...newJob,
      postedByName: jobData.postedByName,
      category: jobData.category || "Lainnya"
    });
  }

  public static async updateJobStatus(jobId: string, status: "ACTIVE" | "REJECTED" | "EXPIRED" | "PENDING"): Promise<Job> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error("Lowongan kerja tidak ditemukan");
    }

    const dataToUpdate: any = { status };
    if (status === "ACTIVE") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      dataToUpdate.createdAt = new Date();
      dataToUpdate.expiresAt = expiresAt;
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: dataToUpdate
    });

    return serializeJob(updatedJob);
  }

  public static async upgradeJobToFeatured(jobId: string, durationDays: number = 14): Promise<Job> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error("Lowongan kerja tidak ditemukan.");
    }

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + durationDays);

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        isFeatured: true,
        featuredUntil
      }
    });

    return serializeJob(updatedJob);
  }

 // ==========================================
  // UTILITY & DEMO CRON-JOB OPERATIONS
  // ==========================================

  // Fungsi khusus untuk simulasi mempercepat tanggal expired
  public static async forceSetJobAge(jobId: string, daysAgo: number): Promise<Job> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("Job tidak ditemukan");

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - daysAgo);

    const expiresDate = new Date(pastDate);
    expiresDate.setDate(expiresDate.getDate() + 30);

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        createdAt: pastDate,
        expiresAt: expiresDate
      }
    });

    return serializeJob(updatedJob);
  }

  // Cron-job logic (Auto-Expire)
  public static async runAutoExpire(): Promise<{ expiredCount: number; updatedJobs: string[] }> {
    const now = new Date();

    // Cari semua job ACTIVE yang sudah melewati expiresAt
    const jobsToExpire = await prisma.job.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: now }
      },
      select: { id: true, title: true }
    });

    if (jobsToExpire.length === 0) {
      return { expiredCount: 0, updatedJobs: [] };
    }

    const jobIds = jobsToExpire.map((j) => j.id);
    const updatedJobs = jobsToExpire.map((j) => j.title);

    // Update massal status menjadi EXPIRED
    await prisma.job.updateMany({
      where: { id: { in: jobIds } },
      data: { status: "EXPIRED" }
    });

    return { expiredCount: jobsToExpire.length, updatedJobs };
  }

  // Delete Job (untuk pemeliharaan data demo)
  public static async deleteJob(id: string): Promise<void> {
    await prisma.job.delete({ where: { id } }).catch(() => null);
  }

  // ==========================================
  // EMAIL NOTIFICATIONS OPERATIONS
  // ==========================================

  public static async getEmails(): Promise<EmailNotification[]> {
    return Database.emailLogs
      .slice()
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  public static async logEmail(emailData: Omit<EmailNotification, "id" | "sentAt">): Promise<EmailNotification> {
    const newEmail: EmailNotification = {
      id: "email-" + Math.random().toString(36).substring(2, 11),
      sentAt: new Date().toISOString(),
      recipient: emailData.recipient ?? emailData.recipientEmail ?? emailData.recipientName ?? emailData.to ?? "",
      recipientEmail: emailData.recipientEmail ?? emailData.to,
      recipientName: emailData.recipientName,
      subject: emailData.subject,
      html: emailData.html ?? emailData.htmlBody ?? emailData.body,
      htmlBody: emailData.htmlBody ?? emailData.html ?? emailData.body,
      body: emailData.body,
      to: emailData.to,
      template: emailData.template,
      status: "SENT"
    };

    Database.emailLogs.unshift(newEmail);
    return newEmail;
  }

  // ==========================================
  // CANDIDATE PROFILE OPERATIONS
  // ==========================================

  public static async getCandidateProfile(userId: string): Promise<CandidateProfile | null> {
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) return null;

    return {
      id: profile.id,
      userId: profile.userId,
      phone: profile.phone ?? undefined,
      bio: profile.bio ?? undefined,
      currentJobTitle: profile.currentJobTitle ?? undefined,
      skills: profile.skills ?? undefined,
      resumeUrl: profile.resumeUrl ?? undefined,
      portfolioUrl: profile.portfolioUrl ?? undefined,
      updatedAt: Database.toIsoDate(profile.updatedAt) ?? ""
    } as CandidateProfile;
  }

  public static async upsertCandidateProfile(userId: string, profileData: Partial<CandidateProfile>): Promise<CandidateProfile> {
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: {
        phone: profileData.phone ?? null,
        bio: profileData.bio ?? null,
        currentJobTitle: profileData.currentJobTitle ?? null,
        skills: profileData.skills ?? null,
        resumeUrl: profileData.resumeUrl ?? null,
        portfolioUrl: profileData.portfolioUrl ?? null,
        updatedAt: new Date()
      },
      create: {
        id: "prof-" + Math.random().toString(36).substring(2, 11),
        userId,
        phone: profileData.phone ?? null,
        bio: profileData.bio ?? null,
        currentJobTitle: profileData.currentJobTitle ?? null,
        skills: profileData.skills ?? null,
        resumeUrl: profileData.resumeUrl ?? null,
        portfolioUrl: profileData.portfolioUrl ?? null
      }
    });

    return {
      id: updatedProfile.id,
      userId: updatedProfile.userId,
      phone: updatedProfile.phone ?? undefined,
      bio: updatedProfile.bio ?? undefined,
      currentJobTitle: updatedProfile.currentJobTitle ?? undefined,
      skills: updatedProfile.skills ?? undefined,
      resumeUrl: updatedProfile.resumeUrl ?? undefined,
      portfolioUrl: updatedProfile.portfolioUrl ?? undefined,
      updatedAt: Database.toIsoDate(updatedProfile.updatedAt) ?? ""
    } as CandidateProfile;
  }

  // ==========================================
  // APPLICATION OPERATIONS
  // ==========================================

  public static async findApplication(jobId: string, candidateId: string): Promise<Application | undefined> {
    const app = await prisma.application.findFirst({
      where: { jobId, candidateId }
    });
    return (app as unknown as Application) || undefined;
  }

  public static async createApplication(dataInput: { jobId: string; candidateId: string; coverLetter?: string }): Promise<Application> {
    const existing = await prisma.application.findFirst({
      where: {
        jobId: dataInput.jobId,
        candidateId: dataInput.candidateId
      }
    });

    if (existing) {
      throw new Error("Anda sudah melamar pekerjaan ini sebelumnya.");
    }

    const job = await prisma.job.findUnique({ where: { id: dataInput.jobId } });
    if (!job) {
      throw new Error("Lowongan kerja tidak ditemukan.");
    }

    const candidate = await prisma.user.findUnique({ where: { id: dataInput.candidateId } });
    const profile = await prisma.profile.findUnique({ where: { userId: dataInput.candidateId } });

    const newApp = await prisma.application.create({
      data: {
        id: "app-" + Math.random().toString(36).substring(2, 11),
        jobId: dataInput.jobId,
        candidateId: dataInput.candidateId,
        coverLetter: dataInput.coverLetter || "",
        status: "APPLIED"
      }
    });

    return {
      id: newApp.id,
      jobId: newApp.jobId,
      candidateId: newApp.candidateId,
      coverLetter: newApp.coverLetter ?? undefined,
      status: newApp.status as ApplicationStatus,
      appliedAt: newApp.appliedAt instanceof Date ? newApp.appliedAt.toISOString() : newApp.appliedAt,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      candidateName: candidate?.name || "Kandidat",
      candidateEmail: candidate?.email || "",
      candidateProfile: (profile as unknown as CandidateProfile) || undefined
    } as Application;
  }

  public static async getCandidateApplications(candidateId: string): Promise<Application[]> {
    const apps = await prisma.application.findMany({
      where: { candidateId },
      include: { job: true },
      orderBy: { appliedAt: "desc" }
    });

    return apps.map((app) => ({
      ...app,
      status: app.status as ApplicationStatus,
      appliedAt: app.appliedAt instanceof Date ? app.appliedAt.toISOString() : app.appliedAt,
      jobTitle: app.job?.title,
      company: app.job?.company,
      location: app.job?.location,
      salary: app.job?.salary
    })) as unknown as Application[];
  }

  public static async getJobApplicants(jobId: string): Promise<Application[]> {
    const apps = await prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          include: { profile: true }
        },
        job: true
      },
      orderBy: { appliedAt: "desc" }
    });

    return apps.map((app) => ({
      ...app,
      status: app.status as ApplicationStatus,
      appliedAt: app.appliedAt instanceof Date ? app.appliedAt.toISOString() : app.appliedAt,
      jobTitle: app.job?.title,
      company: app.job?.company,
      location: app.job?.location,
      salary: app.job?.salary,
      candidateName: app.candidate?.name,
      candidateEmail: app.candidate?.email,
      candidateProfile: app.candidate?.profile ? ({
        id: app.candidate.profile.id,
        userId: app.candidate.profile.userId,
        phone: app.candidate.profile.phone ?? undefined,
        bio: app.candidate.profile.bio ?? undefined,
        currentJobTitle: app.candidate.profile.currentJobTitle ?? undefined,
        skills: app.candidate.profile.skills ?? undefined,
        resumeUrl: app.candidate.profile.resumeUrl ?? undefined,
        portfolioUrl: app.candidate.profile.portfolioUrl ?? undefined,
        updatedAt: Database.toIsoDate(app.candidate.profile.updatedAt) ?? ""
      } as CandidateProfile) : undefined
    })) as unknown as Application[];
  }

  public static async getEmployerApplications(employerId: string, isAdmin?: boolean): Promise<Application[]> {
    let whereCondition = {};

    if (!isAdmin) {
      whereCondition = {
        job: { postedBy: employerId }
      };
    }

    const apps = await prisma.application.findMany({
      where: whereCondition,
      include: {
        candidate: {
          include: { profile: true }
        },
        job: true
      },
      orderBy: { appliedAt: "desc" }
    });

    return apps.map((app) => ({
      ...app,
      status: app.status as ApplicationStatus,
      appliedAt: app.appliedAt instanceof Date ? app.appliedAt.toISOString() : app.appliedAt,
      jobTitle: app.job?.title,
      company: app.job?.company,
      location: app.job?.location,
      salary: app.job?.salary,
      candidateName: app.candidate?.name,
      candidateEmail: app.candidate?.email,
      candidateProfile: app.candidate?.profile ? ({
        id: app.candidate.profile.id,
        userId: app.candidate.profile.userId,
        phone: app.candidate.profile.phone ?? undefined,
        bio: app.candidate.profile.bio ?? undefined,
        currentJobTitle: app.candidate.profile.currentJobTitle ?? undefined,
        skills: app.candidate.profile.skills ?? undefined,
        resumeUrl: app.candidate.profile.resumeUrl ?? undefined,
        portfolioUrl: app.candidate.profile.portfolioUrl ?? undefined,
        updatedAt: Database.toIsoDate(app.candidate.profile.updatedAt) ?? ""
      } as CandidateProfile) : undefined
    })) as unknown as Application[];
  }

  public static async updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<Application> {
    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: { status: status as any }
    });

    return updatedApp as unknown as Application;
  }

  // ==========================================
  // JOB REPORT SYSTEM & MODERATION
  // ==========================================

  public static async createJobReport(params: {
    jobId: string;
    reporterId: string;
    reasonCategory: JobReportReason;
    description: string;
  }): Promise<JobReport> {
    const existing = await prisma.jobReport.findFirst({
      where: {
        jobId: params.jobId,
        reporterId: params.reporterId
      }
    });

    if (existing) {
      throw new Error("Anda sudah pernah melaporkan lowongan pekerjaan ini sebelumnya.");
    }

    const job = await prisma.job.findUnique({ where: { id: params.jobId } });
    if (!job) {
      throw new Error("Lowongan pekerjaan yang dilaporkan tidak ditemukan.");
    }

    const reporter = await prisma.user.findUnique({ where: { id: params.reporterId } });

    const report = await prisma.jobReport.create({
      data: {
        id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        jobId: params.jobId,
        reporterId: params.reporterId,
        reasonCategory: params.reasonCategory as any,
        description: params.description,
        status: "PENDING"
      }
    });

    const employer = await prisma.user.findUnique({ where: { id: job.postedBy } });

    return {
      ...(report as unknown as JobReport),
      jobTitle: job.title,
      company: job.company,
      employerId: job.postedBy,
      employerName: employer?.name || "",
      employerEmail: employer?.email || "",
      employerIsBanned: employer?.isBanned || false,
      reporterName: reporter?.name || "",
      reporterEmail: reporter?.email || ""
    };
  }

  public static async getAllJobReports(): Promise<JobReport[]> {
    const reports = await prisma.jobReport.findMany({
      include: {
        job: {
          include: { postedByUser: true }
        },
        reporter: true
      },
      orderBy: { createdAt: "desc" }
    });

    return reports.map((rep) => ({
      ...rep,
      jobTitle: rep.job?.title || "Lowongan Dihapus",
      company: rep.job?.company || "Perusahaan",
      employerId: rep.job?.postedBy || "",
      employerName: rep.job?.postedByUser?.name || "",
      employerEmail: rep.job?.postedByUser?.email || "",
      employerIsBanned: rep.job?.postedByUser?.isBanned || false,
      reporterName: rep.reporter?.name || "Pelapor",
      reporterEmail: rep.reporter?.email || ""
    })) as unknown as JobReport[];
  }

  public static async updateJobReportStatus(reportId: string, status: JobReportStatus): Promise<JobReport> {
    const updatedRep = await prisma.jobReport.update({
      where: { id: reportId },
      data: { status: status as any }
    });

    const job = await prisma.job.findUnique({ where: { id: updatedRep.jobId } });
    const reporter = await prisma.user.findUnique({ where: { id: updatedRep.reporterId } });
    const employer = job ? await prisma.user.findUnique({ where: { id: job.postedBy } }) : null;

    return {
      ...(updatedRep as unknown as JobReport),
      jobTitle: job?.title || "Lowongan Dihapus",
      company: job?.company || "Perusahaan",
      employerId: job?.postedBy || "",
      employerName: employer?.name || "",
      employerEmail: employer?.email || "",
      employerIsBanned: employer?.isBanned || false,
      reporterName: reporter?.name || "Pelapor",
      reporterEmail: reporter?.email || ""
    };
  }

  public static async takeDownJob(jobId: string): Promise<Job> {
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { status: "REJECTED" }
    });

    // Otomatis tandai laporan terkait sebagai RESOLVED_ACTIONED
    await prisma.jobReport.updateMany({
      where: {
        jobId,
        status: { in: ["PENDING", "INVESTIGATING"] }
      },
      data: { status: "RESOLVED_ACTIONED" }
    });

    return updatedJob as unknown as Job;
  }

  public static async banUserAndTakeDownJobs(userId: string): Promise<{ user: User; takenDownJobsCount: number }> {
    // 1. Set isBanned = true
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true }
    });

    // 2. Hitung & Nonaktifkan seluruh loker milik HRD tersebut
    const userJobs = await prisma.job.findMany({
      where: { postedBy: userId, status: { not: "REJECTED" } },
      select: { id: true }
    });

    const takenDownJobsCount = userJobs.length;
    const jobIds = userJobs.map((j) => j.id);

    if (jobIds.length > 0) {
      await prisma.job.updateMany({
        where: { postedBy: userId },
        data: { status: "REJECTED" }
      });

      // 3. Otomatis ubah status seluruh laporan terkait loker HRD ini menjadi RESOLVED_ACTIONED
      await prisma.jobReport.updateMany({
        where: {
          jobId: { in: jobIds },
          status: { in: ["PENDING", "INVESTIGATING"] }
        },
        data: { status: "RESOLVED_ACTIONED" }
      });
    }

    const { passwordHash, ...userClean } = updatedUser;
    return {
      user: userClean as unknown as User,
      takenDownJobsCount
    };
  }
}