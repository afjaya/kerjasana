/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { User, Job, EmailNotification, CandidateProfile, Application, ApplicationStatus, UserRole, Transaction, PaymentType, PaymentStatus, JobReport, JobReportReason, JobReportStatus } from "../types";

const DB_PATH = path.join(process.cwd(), "db.json");

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  jobs: Job[];
  emails?: EmailNotification[];
  profiles?: CandidateProfile[];
  applications?: Application[];
  transactions?: Transaction[];
  reports?: JobReport[];
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

const DEFAULT_USERS = [
  {
    id: "user-admin",
    name: "Admin Kerjasana",
    email: "admin@kerjasana.com",
    role: "ADMIN" as const,
    subscriptionPlan: "ENTERPRISE",
    jobPostingQuota: 999,
    passwordHash: "admin123", // Demi kemudahan demo & keamanan, kita simpan string sederhana
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
    createdAt: getPastDate(5), // Dibuat 5 hari lalu
    expiresAt: getFutureDate(25), // Berakhir dalam 25 hari
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
    status: "PENDING", // Menunggu persetujuan admin
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
    createdAt: getPastDate(15), // Dibuat 15 hari lalu
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
    createdAt: getPastDate(35), // Dibuat 35 hari yang lalu (SUDAH KADALUARSA)
    expiresAt: getPastDate(5), // Berakhir 5 hari yang lalu
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

export class Database {
  private static read(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const initialData: DatabaseSchema = {
          users: DEFAULT_USERS,
          jobs: DEFAULT_JOBS,
          emails: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
        return initialData;
      }
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(raw) as DatabaseSchema;
      
      let migrated = false;
      if (!parsed.emails) {
        parsed.emails = [];
        migrated = true;
      }
      
      // Auto-migrate: Pastikan semua job memiliki kategori & default jobs lengkap
      if (parsed.jobs && Array.isArray(parsed.jobs)) {
        // Tambahkan default jobs jika belum ada
        DEFAULT_JOBS.forEach((defJob) => {
          if (!parsed.jobs.some((j) => j.id === defJob.id)) {
            parsed.jobs.push(defJob);
            migrated = true;
          }
        });

        parsed.jobs = parsed.jobs.map((job) => {
          if (!job.category) {
            migrated = true;
            const titleLower = job.title.toLowerCase();
            let cat = "Lainnya";
            if (titleLower.includes("developer") || titleLower.includes("programmer") || titleLower.includes("tech") || titleLower.includes("it") || titleLower.includes("software") || titleLower.includes("stack") || titleLower.includes("web")) {
              cat = "IT / Teknologi";
            } else if (titleLower.includes("accounting") || titleLower.includes("keuangan") || titleLower.includes("finance") || titleLower.includes("akuntan") || titleLower.includes("pajak") || titleLower.includes("audit")) {
              cat = "Keuangan & Akuntansi";
            } else if (titleLower.includes("pengajar") || titleLower.includes("tutor") || titleLower.includes("guru") || titleLower.includes("dosen") || titleLower.includes("edukasi") || titleLower.includes("pendidikan")) {
              cat = "Pendidikan & Pelatihan";
            } else if (titleLower.includes("designer") || titleLower.includes("design") || titleLower.includes("creative") || titleLower.includes("ui") || titleLower.includes("ux") || titleLower.includes("video") || titleLower.includes("seni")) {
              cat = "Desain & Media";
            } else if (titleLower.includes("marketing") || titleLower.includes("sales") || titleLower.includes("promo") || titleLower.includes("iklan") || titleLower.includes("penjualan") || titleLower.includes("pemasaran")) {
              cat = "Sales & Marketing";
            } else if (titleLower.includes("barista") || titleLower.includes("cook") || titleLower.includes("chef") || titleLower.includes("waiter") || titleLower.includes("pelayan") || titleLower.includes("kasir") || titleLower.includes("kopi") || titleLower.includes("outlet") || titleLower.includes("makanan") || titleLower.includes("minuman")) {
              cat = "F&B / Pelayanan";
            } else if (titleLower.includes("admin") || titleLower.includes("staff") || titleLower.includes("administrasi") || titleLower.includes("sekretaris") || titleLower.includes("kantor") || titleLower.includes("tata usaha")) {
              cat = "Administrasi & Umum";
            }
            return { ...job, category: cat };
          }
          return job;
        });
      }
      
      if (!parsed.profiles) parsed.profiles = [];
      if (!parsed.applications) parsed.applications = [];
      if (!parsed.transactions) parsed.transactions = [];
      if (!parsed.reports) {
        parsed.reports = [];
        migrated = true;
      }

      // Auto-migrate Users for subscription, quota, & isBanned
      if (parsed.users && Array.isArray(parsed.users)) {
        parsed.users = parsed.users.map((u) => {
          let uMigrated = false;
          const subPlan = u.subscriptionPlan || "FREE";
          const quota = u.jobPostingQuota !== undefined ? u.jobPostingQuota : (u.role === "ADMIN" ? 999 : 2);
          const isBanned = u.isBanned ?? false;
          if (u.subscriptionPlan !== subPlan || u.jobPostingQuota !== quota || u.isBanned === undefined) {
            uMigrated = true;
            migrated = true;
          }
          return {
            ...u,
            subscriptionPlan: subPlan,
            jobPostingQuota: quota,
            isBanned
          };
        });
      }

      if (migrated) {
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), "utf-8");
      }
      return parsed;
    } catch (e) {
      console.error("Gagal membaca database file, menggunakan default in-memory", e);
      return { users: DEFAULT_USERS, jobs: DEFAULT_JOBS, profiles: [], applications: [], transactions: [] };
    }
  }

  private static write(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Gagal menulis database file", e);
    }
  }

  // Auth Operations
  public static getUsers() {
    return this.read().users;
  }

  public static findUserByEmail(email: string) {
    return this.read().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public static findUserById(id: string) {
    return this.read().users.find((u) => u.id === id);
  }

  public static createUser(name: string, email: string, passwordHash: string, role: UserRole = "USER"): User {
    const data = this.read();
    
    // Validasi email unik
    const exists = data.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error("Email sudah terdaftar");
    }

    const newUser: User = {
      id: "user-" + Math.random().toString(36).substring(2, 11),
      name,
      email,
      role,
      subscriptionPlan: role === "ADMIN" ? "ENTERPRISE" : "FREE",
      jobPostingQuota: role === "ADMIN" ? 999 : (role === "CANDIDATE" ? 0 : 2),
      createdAt: new Date().toISOString()
    };

    data.users.push({ ...newUser, passwordHash });
    this.write(data);
    return newUser;
  }

  // Job Operations
  public static getJobs(): Job[] {
    return this.read().jobs;
  }

  public static getActiveJobs(): Job[] {
    const jobs = this.read().jobs.filter((j) => j.status === "ACTIVE");
    // Sort logic: Featured jobs first, then by createdAt descending
    return jobs.sort((a, b) => {
      const aFeatured = !!(a.isFeatured && (!a.featuredUntil || new Date(a.featuredUntil) > new Date()));
      const bFeatured = !!(b.isFeatured && (!b.featuredUntil || new Date(b.featuredUntil) > new Date()));

      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public static upgradeJobToFeatured(jobId: string, durationDays: number = 14): Job {
    const data = this.read();
    const index = data.jobs.findIndex((j) => j.id === jobId);
    if (index === -1) {
      throw new Error("Lowongan kerja tidak ditemukan.");
    }

    const featuredUntil = getFutureDate(durationDays);
    data.jobs[index] = {
      ...data.jobs[index],
      isFeatured: true,
      featuredUntil
    };

    this.write(data);
    return data.jobs[index];
  }

  public static updateUserSubscription(userId: string, plan: "PRO" | "ENTERPRISE"): User {
    const data = this.read();
    const index = data.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    const addedQuota = plan === "PRO" ? 10 : 50;
    const currentQuota = data.users[index].jobPostingQuota || 0;

    data.users[index] = {
      ...data.users[index],
      subscriptionPlan: plan,
      jobPostingQuota: currentQuota + addedQuota
    };

    this.write(data);
    const { passwordHash, ...userWithoutPassword } = data.users[index];
    return userWithoutPassword;
  }

  // Payment & Transaction Operations
  public static createTransaction(txInput: {
    userId: string;
    jobId?: string;
    amount: number;
    paymentType: PaymentType;
    paymentMethod?: string;
    status?: PaymentStatus;
    referenceId: string;
  }): Transaction {
    const data = this.read();
    if (!data.transactions) data.transactions = [];

    const user = data.users.find((u) => u.id === txInput.userId);
    const job = txInput.jobId ? data.jobs.find((j) => j.id === txInput.jobId) : undefined;

    const newTx: Transaction = {
      id: "tx-" + Math.random().toString(36).substring(2, 11),
      userId: txInput.userId,
      jobId: txInput.jobId,
      amount: txInput.amount,
      paymentType: txInput.paymentType,
      paymentMethod: txInput.paymentMethod || "DEMO_BYPASS",
      status: txInput.status || "PAID",
      referenceId: txInput.referenceId,
      createdAt: new Date().toISOString(),
      jobTitle: job?.title,
      company: job?.company,
      userName: user?.name,
      userEmail: user?.email
    };

    data.transactions.unshift(newTx);
    this.write(data);
    return newTx;
  }

  public static getTransactions(userId?: string): Transaction[] {
    const data = this.read();
    let list = data.transactions || [];
    if (userId) {
      list = list.filter((t) => t.userId === userId);
    }
    return list.map((tx) => {
      const user = data.users.find((u) => u.id === tx.userId);
      const job = tx.jobId ? data.jobs.find((j) => j.id === tx.jobId) : undefined;
      return {
        ...tx,
        jobTitle: job?.title || tx.jobTitle,
        company: job?.company || tx.company,
        userName: user?.name || tx.userName,
        userEmail: user?.email || tx.userEmail
      };
    });
  }

  public static findJobById(id: string | number): Job | undefined {
    if (id === undefined || id === null) return undefined;
    const strId = String(id).trim();
    if (!strId) return undefined;

    const jobs = this.read().jobs;

    // 1. Exact match
    let found = jobs.find((j) => String(j.id) === strId);
    if (found) return found;

    // 2. Prefix 'job-' match
    found = jobs.find((j) => String(j.id) === `job-${strId}` || `job-${j.id}` === strId);
    if (found) return found;

    // 3. Integer/Numeric match
    const numId = parseInt(strId.replace(/\D/g, ""), 10);
    if (!isNaN(numId)) {
      found = jobs.find((j) => {
        const jNum = parseInt(String(j.id).replace(/\D/g, ""), 10);
        return !isNaN(jNum) && jNum === numId;
      });
      if (found) return found;
    }

    return undefined;
  }

  public static createJob(jobData: Omit<Job, "id" | "status" | "createdAt" | "expiresAt">): Job {
    const data = this.read();
    
    const newJob: Job = {
      ...jobData,
      id: "job-" + Math.random().toString(36).substring(2, 11),
      status: "PENDING", // Selalu PENDING saat pertama kali dibuat
      createdAt: new Date().toISOString(),
      expiresAt: getFutureDate(30) // Berakhir otomatis 30 hari kemudian
    };

    data.jobs.unshift(newJob); // Masukkan ke atas
    this.write(data);
    return newJob;
  }

  public static updateJobStatus(jobId: string, status: "ACTIVE" | "REJECTED" | "EXPIRED" | "PENDING"): Job {
    const data = this.read();
    const jobIndex = data.jobs.findIndex((j) => j.id === jobId);
    
    if (jobIndex === -1) {
      throw new Error("Lowongan kerja tidak ditemukan");
    }

    const updatedJob = { ...data.jobs[jobIndex], status };
    
    // Jika status diubah menjadi ACTIVE, kita perbarui tanggal expired agar 30 hari sejak disetujui (opsional/fleksibel)
    if (status === "ACTIVE") {
      updatedJob.createdAt = new Date().toISOString();
      updatedJob.expiresAt = getFutureDate(30);
    }

    data.jobs[jobIndex] = updatedJob;
    this.write(data);
    return updatedJob;
  }

  // Fungsi khusus untuk simulasi mempercepat tanggal expired
  public static forceSetJobAge(jobId: string, daysAgo: number): Job {
    const data = this.read();
    const jobIndex = data.jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) throw new Error("Job tidak ditemukan");

    const pastDate = getPastDate(daysAgo);
    const expiresDate = getFutureDate(30 - daysAgo, new Date(pastDate));

    data.jobs[jobIndex].createdAt = pastDate;
    data.jobs[jobIndex].expiresAt = expiresDate;

    this.write(data);
    return data.jobs[jobIndex];
  }

  // Cron-job logic (Auto-Expire)
  public static runAutoExpire(): { expiredCount: number; updatedJobs: string[] } {
    const data = this.read();
    const now = new Date();
    let expiredCount = 0;
    const updatedJobs: string[] = [];

    data.jobs = data.jobs.map((job) => {
      // Hanya ganti jika statusnya ACTIVE dan masa berlakunya sudah lewat
      if (job.status === "ACTIVE" && new Date(job.expiresAt) < now) {
        expiredCount++;
        updatedJobs.push(job.title);
        return { ...job, status: "EXPIRED" as const };
      }
      return job;
    });

    if (expiredCount > 0) {
      this.write(data);
    }

    return { expiredCount, updatedJobs };
  }

  // Delete Job (untuk pemeliharaan data demo)
  public static deleteJob(id: string): void {
    const data = this.read();
    data.jobs = data.jobs.filter((j) => j.id !== id);
    this.write(data);
  }

  // Email Notifications operations
  public static getEmails(): EmailNotification[] {
    const data = this.read();
    return data.emails || [];
  }

  public static logEmail(emailData: Omit<EmailNotification, "id" | "sentAt">): EmailNotification {
    const data = this.read();
    if (!data.emails) {
      data.emails = [];
    }

    const newEmail: EmailNotification = {
      ...emailData,
      id: "email-" + Math.random().toString(36).substring(2, 11),
      sentAt: new Date().toISOString()
    };

    data.emails.unshift(newEmail); // Taruh di baris paling atas (terbaru dahulu)
    this.write(data);
    return newEmail;
  }

  // Candidate Profile Operations
  public static getCandidateProfile(userId: string): CandidateProfile | null {
    const data = this.read();
    return (data.profiles || []).find((p) => p.userId === userId) || null;
  }

  public static upsertCandidateProfile(userId: string, profileData: Partial<CandidateProfile>): CandidateProfile {
    const data = this.read();
    if (!data.profiles) data.profiles = [];

    const existingIndex = data.profiles.findIndex((p) => p.userId === userId);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated: CandidateProfile = {
        ...data.profiles[existingIndex],
        ...profileData,
        updatedAt: now
      };
      data.profiles[existingIndex] = updated;
      this.write(data);
      return updated;
    } else {
      const newProfile: CandidateProfile = {
        id: "prof-" + Math.random().toString(36).substring(2, 11),
        userId,
        phone: profileData.phone || "",
        bio: profileData.bio || "",
        currentJobTitle: profileData.currentJobTitle || "",
        skills: profileData.skills || "",
        resumeUrl: profileData.resumeUrl || "",
        portfolioUrl: profileData.portfolioUrl || "",
        dailyEmailAlerts: profileData.dailyEmailAlerts ?? false,
        alertCategory: profileData.alertCategory || "",
        alertLocation: profileData.alertLocation || "",
        alertKeywords: profileData.alertKeywords || "",
        updatedAt: now
      };
      data.profiles.push(newProfile);
      this.write(data);
      return newProfile;
    }
  }

  // Application Operations
  public static findApplication(jobId: string, candidateId: string): Application | undefined {
    const data = this.read();
    return (data.applications || []).find((a) => a.jobId === jobId && a.candidateId === candidateId);
  }

  public static createApplication(dataInput: { jobId: string; candidateId: string; coverLetter?: string }): Application {
    const data = this.read();
    if (!data.applications) data.applications = [];

    // Check unique constraint @@unique([jobId, candidateId])
    const existing = data.applications.find((a) => a.jobId === dataInput.jobId && a.candidateId === dataInput.candidateId);
    if (existing) {
      throw new Error("Anda sudah melamar pekerjaan ini sebelumnya.");
    }

    const job = data.jobs.find((j) => j.id === dataInput.jobId);
    if (!job) {
      throw new Error("Lowongan kerja tidak ditemukan.");
    }

    const candidate = data.users.find((u) => u.id === dataInput.candidateId);
    const profile = (data.profiles || []).find((p) => p.userId === dataInput.candidateId);

    const newApp: Application = {
      id: "app-" + Math.random().toString(36).substring(2, 11),
      jobId: dataInput.jobId,
      candidateId: dataInput.candidateId,
      coverLetter: dataInput.coverLetter || "",
      status: "APPLIED",
      appliedAt: new Date().toISOString(),
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      candidateName: candidate?.name || "Kandidat",
      candidateEmail: candidate?.email || "",
      candidateProfile: profile || undefined
    };

    data.applications.unshift(newApp);
    this.write(data);
    return newApp;
  }

  public static getCandidateApplications(candidateId: string): Application[] {
    const data = this.read();
    const apps = (data.applications || []).filter((a) => a.candidateId === candidateId);
    return apps.map((app) => {
      const job = data.jobs.find((j) => j.id === app.jobId);
      return {
        ...app,
        jobTitle: job?.title || app.jobTitle,
        company: job?.company || app.company,
        location: job?.location || app.location,
        salary: job?.salary || app.salary
      };
    });
  }

  public static getJobApplicants(jobId: string): Application[] {
    const data = this.read();
    const apps = (data.applications || []).filter((a) => a.jobId === jobId);
    return apps.map((app) => {
      const candidate = data.users.find((u) => u.id === app.candidateId);
      const profile = (data.profiles || []).find((p) => p.userId === app.candidateId);
      const job = data.jobs.find((j) => j.id === app.jobId);
      return {
        ...app,
        jobTitle: job?.title || app.jobTitle,
        company: job?.company || app.company,
        location: job?.location || app.location,
        salary: job?.salary || app.salary,
        candidateName: candidate?.name || app.candidateName,
        candidateEmail: candidate?.email || app.candidateEmail,
        candidateProfile: profile || app.candidateProfile
      };
    }).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }

  public static getEmployerApplications(employerId: string, isAdmin?: boolean): Application[] {
    const data = this.read();
    let apps = data.applications || [];

    if (!isAdmin) {
      const myJobIds = new Set(data.jobs.filter((j) => j.postedBy === employerId).map((j) => j.id));
      apps = apps.filter((a) => myJobIds.has(a.jobId));
    }

    return apps.map((app) => {
      const candidate = data.users.find((u) => u.id === app.candidateId);
      const profile = (data.profiles || []).find((p) => p.userId === app.candidateId);
      const job = data.jobs.find((j) => j.id === app.jobId);
      return {
        ...app,
        jobTitle: job?.title || app.jobTitle,
        company: job?.company || app.company,
        location: job?.location || app.location,
        salary: job?.salary || app.salary,
        candidateName: candidate?.name || app.candidateName,
        candidateEmail: candidate?.email || app.candidateEmail,
        candidateProfile: profile || app.candidateProfile
      };
    }).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }

  public static updateApplicationStatus(applicationId: string, status: ApplicationStatus): Application {
    const data = this.read();
    if (!data.applications) data.applications = [];

    const index = data.applications.findIndex((a) => a.id === applicationId);
    if (index === -1) {
      throw new Error("Lamaran tidak ditemukan.");
    }

    data.applications[index].status = status;
    this.write(data);
    return data.applications[index];
  }

  // ==========================================
  // LAPORKAN LOWONGAN (JOB REPORT SYSTEM) & MODERASI
  // ==========================================

  public static createJobReport(params: {
    jobId: string;
    reporterId: string;
    reasonCategory: JobReportReason;
    description: string;
  }): JobReport {
    const data = this.read();
    if (!data.reports) data.reports = [];

    // Validasi 1 user hanya bisa melaporkan loker yang sama 1 kali
    const existing = data.reports.find(
      (r) => r.jobId === params.jobId && r.reporterId === params.reporterId
    );
    if (existing) {
      throw new Error("Anda sudah pernah melaporkan lowongan pekerjaan ini sebelumnya.");
    }

    const job = data.jobs.find((j) => j.id === params.jobId);
    if (!job) {
      throw new Error("Lowongan pekerjaan yang dilaporkan tidak ditemukan.");
    }

    const reporter = data.users.find((u) => u.id === params.reporterId);

    const report: JobReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      jobId: params.jobId,
      reporterId: params.reporterId,
      reasonCategory: params.reasonCategory,
      description: params.description,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    data.reports.push(report);
    this.write(data);

    // Return populated report for UI display
    const employer = data.users.find((u) => u.id === job.postedBy);
    return {
      ...report,
      jobTitle: job.title,
      company: job.company,
      employerId: job.postedBy,
      employerName: employer?.name || job.postedByName,
      employerEmail: employer?.email || "",
      employerIsBanned: employer?.isBanned || false,
      reporterName: reporter?.name || "",
      reporterEmail: reporter?.email || ""
    };
  }

  public static getAllJobReports(): JobReport[] {
    const data = this.read();
    const reports = data.reports || [];

    return reports.map((rep) => {
      const job = data.jobs.find((j) => j.id === rep.jobId);
      const reporter = data.users.find((u) => u.id === rep.reporterId);
      const employer = job ? data.users.find((u) => u.id === job.postedBy) : undefined;

      return {
        ...rep,
        jobTitle: job?.title || "Lowongan Dihapus",
        company: job?.company || "Perusahaan",
        employerId: job?.postedBy || "",
        employerName: employer?.name || job?.postedByName || "",
        employerEmail: employer?.email || "",
        employerIsBanned: employer?.isBanned || false,
        reporterName: reporter?.name || "Pelapor",
        reporterEmail: reporter?.email || ""
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static updateJobReportStatus(reportId: string, status: JobReportStatus): JobReport {
    const data = this.read();
    if (!data.reports) data.reports = [];

    const index = data.reports.findIndex((r) => r.id === reportId);
    if (index === -1) {
      throw new Error("Laporan tidak ditemukan.");
    }

    data.reports[index].status = status;
    this.write(data);

    const updatedRep = data.reports[index];
    const job = data.jobs.find((j) => j.id === updatedRep.jobId);
    const reporter = data.users.find((u) => u.id === updatedRep.reporterId);
    const employer = job ? data.users.find((u) => u.id === job.postedBy) : undefined;

    return {
      ...updatedRep,
      jobTitle: job?.title || "Lowongan Dihapus",
      company: job?.company || "Perusahaan",
      employerId: job?.postedBy || "",
      employerName: employer?.name || job?.postedByName || "",
      employerEmail: employer?.email || "",
      employerIsBanned: employer?.isBanned || false,
      reporterName: reporter?.name || "Pelapor",
      reporterEmail: reporter?.email || ""
    };
  }

  public static takeDownJob(jobId: string): Job {
    const data = this.read();
    const index = data.jobs.findIndex((j) => j.id === jobId);
    if (index === -1) {
      throw new Error("Lowongan kerja tidak ditemukan.");
    }

    // Ubah status job menjadi REJECTED / TAKEN DOWN
    data.jobs[index].status = "REJECTED";

    // Otomatis tandai laporan terkait sebagai RESOLVED_ACTIONED
    if (data.reports) {
      data.reports = data.reports.map((r) => {
        if (r.jobId === jobId && (r.status === "PENDING" || r.status === "INVESTIGATING")) {
          return { ...r, status: "RESOLVED_ACTIONED" };
        }
        return r;
      });
    }

    this.write(data);
    return data.jobs[index];
  }

  public static banUserAndTakeDownJobs(userId: string): { user: User; takenDownJobsCount: number } {
    const data = this.read();
    const userIndex = data.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User tidak ditemukan.");
    }

    // Set isBanned = true
    data.users[userIndex].isBanned = true;

    // Nonaktifkan seluruh loker milik HRD tersebut
    let takenDownJobsCount = 0;
    const bannedJobIds = new Set<string>();

    data.jobs = data.jobs.map((j) => {
      if (j.postedBy === userId) {
        if (j.status !== "REJECTED") {
          takenDownJobsCount++;
        }
        bannedJobIds.add(j.id);
        return { ...j, status: "REJECTED" as const };
      }
      return j;
    });

    // Otomatis ubah status seluruh laporan terkait loker HRD ini menjadi RESOLVED_ACTIONED
    if (data.reports) {
      data.reports = data.reports.map((r) => {
        if (bannedJobIds.has(r.jobId) && (r.status === "PENDING" || r.status === "INVESTIGATING")) {
          return { ...r, status: "RESOLVED_ACTIONED" };
        }
        return r;
      });
    }

    this.write(data);

    const { passwordHash, ...userClean } = data.users[userIndex];
    return {
      user: userClean,
      takenDownJobsCount
    };
  }
}
