/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "ADMIN" | "USER" | "CANDIDATE";

export type JobStatus = "PENDING" | "ACTIVE" | "REJECTED" | "EXPIRED";

export type ApplicationStatus = "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED";

export type PaymentType = "FEATURED_JOB" | "SUBSCRIPTION_PRO" | "SUBSCRIPTION_ENTERPRISE";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface Transaction {
  id: string;
  userId: string;
  jobId?: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: string;
  status: PaymentStatus;
  referenceId: string;
  createdAt: string;
  jobTitle?: string;
  company?: string;
  userName?: string;
  userEmail?: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  phone?: string;
  bio?: string;
  currentJobTitle?: string;
  skills?: string; // Comma separated or string
  resumeUrl?: string;
  portfolioUrl?: string;
  dailyEmailAlerts?: boolean;
  alertCategory?: string;
  alertLocation?: string;
  alertKeywords?: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: string;
  // Metadata tambahan untuk UI/display
  jobTitle?: string;
  company?: string;
  location?: string;
  salary?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateProfile?: CandidateProfile;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subscriptionPlan?: string; // "FREE" | "PRO" | "ENTERPRISE"
  jobPostingQuota?: number; // Kuota posting loker
  isBanned?: boolean; // Tanda jika akun diblokir karena pelanggaran
  createdAt: string;
}

export type JobReportReason = "PUNGLI_BIAYA" | "INDIKASI_PENIPUAN" | "DATA_PALSU" | "DISKRIMINASI" | "LAINNYA";

export type JobReportStatus = "PENDING" | "INVESTIGATING" | "RESOLVED_REJECTED" | "RESOLVED_ACTIONED";

export interface JobReport {
  id: string;
  jobId: string;
  reporterId: string;
  reasonCategory: JobReportReason;
  description: string;
  status: JobReportStatus;
  createdAt: string;
  // Metadata tambahan untuk Admin UI
  jobTitle?: string;
  company?: string;
  employerId?: string;
  employerName?: string;
  employerEmail?: string;
  employerIsBanned?: boolean;
  reporterName?: string;
  reporterEmail?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  salaryMin?: number; // Rentang Gaji Minimal (Opsional, contoh: 4000000)
  salaryMax?: number; // Rentang Gaji Maksimal (Opsional, contoh: 6000000)
  salaryPeriod?: string; // Periode Gaji (Opsional, contoh: "Bulan", "Jam", "Hari", "Proyek")
  description: string;
  requirements: string;
  contact: string;
  status: JobStatus;
  isFeatured?: boolean; // Loker Prioritas/Featured
  featuredUntil?: string; // Expire date untuk status Featured
  postedBy: string; // UserId dari pembuat loker
  postedByName: string; // Nama pembuat loker
  createdAt: string;
  expiresAt: string; // Otomatis 30 hari dari createdAt
  category?: string; // Kategori pekerjaan
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Stats {
  totalJobs: number;
  pendingJobs: number;
  activeJobs: number;
  rejectedJobs: number;
  expiredJobs: number;
}

export interface EmailNotification {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  html: string;
  sentAt: string;
  etherealUrl?: string; // Tautan preview Ethereal nyata jika ada
  status: "SENT" | "FAILED";
  error?: string;
}

