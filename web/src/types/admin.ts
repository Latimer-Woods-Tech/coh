/**
 * Admin Dashboard Type Definitions
 * Comprehensive type interfaces for all admin panel data
 */

// ═══════════════════════════════════════════════════════════════════
// USERS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'instructor' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  joinedAt: string;
  lastLogin?: string;
  enrollments?: number;
  bookings?: number;
  orders?: number;
  avatar?: string;
}

export interface UserFilter {
  role?: string;
  status?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ═══════════════════════════════════════════════════════════════════
// BOOKINGS/APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════
export interface AdminBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  scheduledAt: string;
  duration: number; // minutes
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

export interface BookingFilter {
  status?: string;
  serviceId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

// ═══════════════════════════════════════════════════════════════════
// STORE/PRODUCTS
// ═══════════════════════════════════════════════════════════════════
export interface AdminProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  stock: number;
  sku?: string;
  featured: boolean;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: string;
}

export interface StoreFilter {
  category?: string;
  status?: string;
  priceFrom?: number;
  priceTo?: number;
  searchTerm?: string;
}

// ═══════════════════════════════════════════════════════════════════
// EMAIL CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════
export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  template: string;
  recipientCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  openRate?: number;
  clickRate?: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'welcome' | 'reminder' | 'promotion' | 'notification' | 'custom';
  variables?: string[];
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════
export interface AnalyticsMetric {
  id: string;
  label: string;
  value: number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'stable';
  icon?: string;
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

export interface CohortAnalysis {
  cohort: string;
  total: number;
  retained: number;
  retentionRate: number;
}

// ═══════════════════════════════════════════════════════════════════
// CONTENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
export interface AdminLesson {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  moduleId: string;
  moduleName: string;
  status: 'draft' | 'published' | 'archived';
  contentType: 'text' | 'video' | 'audio' | 'interactive';
  audioUrl?: string;
  audioTranscript?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface AdminCourse extends AdminLesson {
  description?: string;
  duration?: number;
  students?: number;
  rating?: number;
}

export interface ContentFilter {
  status?: string;
  contentType?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

// ═══════════════════════════════════════════════════════════════════
// REVIEWS & TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════
export interface Review {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  comment: string;
  type: 'course' | 'product' | 'service' | 'overall';
  relatedId?: string; // courseId, productId, serviceId
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  createdAt: string;
  approvedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SETTINGS & CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
export interface AdminSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
  };
  pricing: {
    defaultCurrency: string;
    taxRate: number;
    freeShippingThreshold: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    fromEmail: string;
    replyTo: string;
    enabled: boolean;
  };
  features: {
    bookingsEnabled: boolean;
    storeEnabled: boolean;
    eventsEnabled: boolean;
    academyEnabled: boolean;
  };
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  active: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════
export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  createdAt: string;
  duration?: number; // milliseconds
}

export interface LoginHistory {
  id: string;
  userId: string;
  userName: string;
  email: string;
  loginAt: string;
  logoutAt?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH & FILTERING
// ═══════════════════════════════════════════════════════════════════
export interface SearchPreset {
  id: string;
  name: string;
  type: 'users' | 'orders' | 'bookings' | 'courses' | 'reviews' | 'logs';
  filters: Record<string, unknown>;
  createdAt: string;
  isPinned: boolean;
}

export interface SearchResult {
  id: string;
  type: 'user' | 'order' | 'booking' | 'course' | 'review' | 'log';
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  url?: string;
}

// ═══════════════════════════════════════════════════════════════════
// BULK OPERATIONS & EXPORTS
// ═══════════════════════════════════════════════════════════════════
export interface ExportData {
  id: string;
  name: string;
  type: 'csv' | 'pdf' | 'json';
  dataType: 'users' | 'orders' | 'bookings' | 'products' | 'courses';
  status: 'pending' | 'processing' | 'ready' | 'failed';
  fileUrl?: string;
  createdAt: string;
  expiresAt?: string;
  filters?: Record<string, unknown>;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: 'csv' | 'pdf';
  dataType: 'analytics' | 'revenue' | 'users' | 'engagement';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

// ═══════════════════════════════════════════════════════════════════
// COMMON UTILITIES
// ═══════════════════════════════════════════════════════════════════
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationState;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
