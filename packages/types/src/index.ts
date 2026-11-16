/**
 * ServeFlow shared types and enums.
 * Used by both frontend (apps/web) and backend (apps/api).
 */

// ---------------------------------------------------------------------------
// Platform-level roles
// ---------------------------------------------------------------------------

export type PlatformRole = "SUPER_ADMIN" | "USER";

export const PlatformRole: Record<PlatformRole, PlatformRole> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  USER: "USER",
};

// ---------------------------------------------------------------------------
// Business-scoped membership roles
// ---------------------------------------------------------------------------

export type MembershipRole = "OWNER" | "ADMIN" | "STAFF" | "VIEWER";

export const MembershipRole: Record<MembershipRole, MembershipRole> = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  VIEWER: "VIEWER",
};

// ---------------------------------------------------------------------------
// Appointment status
// ---------------------------------------------------------------------------

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export const AppointmentStatus: Record<AppointmentStatus, AppointmentStatus> = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
};

export const PENDING_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];
export const TERMINAL_STATUSES: AppointmentStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

// ---------------------------------------------------------------------------
// Payment status
// ---------------------------------------------------------------------------

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED";

export const PaymentStatus: Record<PaymentStatus, PaymentStatus> = {
  PENDING: "PENDING",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
};

// ---------------------------------------------------------------------------
// Notification channel & type
// ---------------------------------------------------------------------------

export type NotificationChannel = "EMAIL" | "SMS" | "IN_APP";

export const NotificationChannel: Record<NotificationChannel, NotificationChannel> = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  IN_APP: "IN_APP",
};

export type NotificationType =
  | "BOOKING_CONFIRMATION"
  | "APPOINTMENT_UPDATE"
  | "APPOINTMENT_CANCELLATION"
  | "APPOINTMENT_REMINDER"
  | "BUSINESS_ALERT";

export const NotificationType: Record<NotificationType, NotificationType> = {
  BOOKING_CONFIRMATION: "BOOKING_CONFIRMATION",
  APPOINTMENT_UPDATE: "APPOINTMENT_UPDATE",
  APPOINTMENT_CANCELLATION: "APPOINTMENT_CANCELLATION",
  APPOINTMENT_REMINDER: "APPOINTMENT_REMINDER",
  BUSINESS_ALERT: "BUSINESS_ALERT",
};

// ---------------------------------------------------------------------------
// Business status
// ---------------------------------------------------------------------------

export type BusinessStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";

export const BusinessStatus: Record<BusinessStatus, BusinessStatus> = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  CLOSED: "CLOSED",
};

// ---------------------------------------------------------------------------
// Notification status
// ---------------------------------------------------------------------------

export type NotificationStatus = "PENDING" | "SENT" | "FAILED";

export const NotificationStatus: Record<NotificationStatus, NotificationStatus> = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
};

// ---------------------------------------------------------------------------
// Slug validation helper
// ---------------------------------------------------------------------------

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

// ---------------------------------------------------------------------------
// Shared DTO shapes (kept lightweight; backend DTOs may extend)
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorEnvelope {
  statusCode: number;
  message: string[];
  error: string;
  timestamp: string;
  path: string;
}
