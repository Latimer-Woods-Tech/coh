import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send HttpOnly authToken cookie on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.history.replaceState(null, '', `/login?redirect=${encodeURIComponent(currentPath)}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
    return Promise.reject(error.response?.data ?? error);
  }
);

export default apiClient;

function formatDuration(durationMinutes: number) {
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

function formatEventTime(value?: string | null) {
  if (!value) {
    return 'TBD';
  }

  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── AUTHENTICATION API ───────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const authApi = {
  signup: (data: { email: string; password: string; name: string }) =>
    apiClient.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  refreshToken: () => apiClient.post('/auth/refresh-token', {}),

  getProfile: () =>
    apiClient.get('/auth/me'),

  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) =>
    apiClient.put('/auth/me', data),

  logout: () =>
    apiClient.post('/auth/logout'),
};

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── ACADEMY API ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const academyApi = {
  // Courses
  listCourses: () =>
    apiClient.get('/academy/courses').then((response) =>
      ((response?.courses as Array<Record<string, unknown>> | undefined) ?? []).map((course) => ({
        ...course,
        slug: String(course.slug ?? ''),
        price: Number(course.price ?? 0),
        modules: [],
      }))
    ),

  getCourseDetail: (courseId: string) =>
    apiClient.get(`/academy/courses/${courseId}`),

  // Enrollment
  enrollCourse: (courseId: string) =>
    apiClient.post(`/academy/courses/${courseId}/enroll`),

  getEnrollments: () =>
    apiClient.get('/academy/enrollments'),

  getEnrollmentDetail: (enrollmentId: string) =>
    apiClient.get(`/academy/enrollments/${enrollmentId}`),

  // Lessons
  getLesson: (lessonId: string) =>
    apiClient.get(`/academy/lessons/${lessonId}`),

  getLessonsForCourse: (courseId: string) =>
    apiClient.get(`/academy/courses/${courseId}/lessons`),

  markLessonComplete: (lessonId: string, watchTimeSeconds?: number) =>
    apiClient.post(`/academy/lessons/${lessonId}/complete`, {
      watchTimeSeconds: watchTimeSeconds || 0,
    }),

  // Audio streaming
  getAudioStream: async (audioUrl: string) => {
    const response = await axios.get(audioUrl, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Audio generation & management
  generateAudio: (lessonId: string, voiceId?: string) =>
    apiClient.post(`/academy/lessons/${lessonId}/generate-audio`, {
      voiceId: voiceId || 'default',
    }),

  getAudioTranscript: (lessonId: string) =>
    apiClient.get(`/academy/lessons/${lessonId}/transcript`),

  downloadAudio: (lessonId: string) =>
    apiClient.get(`/academy/lessons/${lessonId}/audio/download`, {
      responseType: 'blob',
    }),
};

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── BOOKING API ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const bookingApi = {
  // Services
  listServices: () =>
    apiClient.get('/booking/services').then((response) =>
      ((response?.services as Array<Record<string, unknown>> | undefined) ?? []).map((service) => ({
        ...service,
        duration: formatDuration(Number(service.durationMinutes ?? 0)),
        price: Number(service.price ?? 0),
      }))
    ),

  getServiceDetail: (serviceId: string) =>
    apiClient.get(`/booking/services/${serviceId}`),

  // Availability
  getAvailability: (serviceId: string, date?: string) =>
    apiClient.get('/booking/availability', {
      params: { serviceId, date },
    }).then((response) =>
      ((response?.availableSlots as string[] | undefined) ?? []).map((time) => ({
        time,
        available: true,
      }))
    ),

  // Appointments
  createAppointment: (data: {
    serviceId: string;
    scheduledAt: string;
    notes?: string;
  }) =>
    apiClient.post('/booking/appointments', data),

  getAppointments: () =>
    apiClient.get('/booking/appointments'),

  getAppointmentDetail: (appointmentId: string) =>
    apiClient.get(`/booking/appointments/${appointmentId}`),

  cancelAppointment: (appointmentId: string) =>
    apiClient.patch(`/booking/appointments/${appointmentId}/cancel`),
};

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── STORE API ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const storeApi = {
  // Categories
  listCategories: () =>
    apiClient.get('/store/categories').then((response) => response?.categories ?? []),

  getCategoryDetail: (categoryId: string) =>
    apiClient.get(`/store/categories/${categoryId}`),

  // Products
  listProducts: (categoryId?: string) =>
    apiClient.get('/store/products', {
      params: categoryId ? { categoryId } : undefined,
    }).then((response) =>
      ((response?.products as Array<Record<string, unknown>> | undefined) ?? []).map((product) => ({
        ...product,
        price: Number(product.price ?? 0),
        image: Array.isArray(product.images) && product.images.length > 0
          ? String((product.images[0] as Record<string, unknown>).url ?? '')
          : '',
        detail: String(product.shortDescription ?? product.description ?? ''),
        featured: Boolean(product.isFeatured),
      }))
    ),

  getProductDetail: (productId: string) =>
    apiClient.get(`/store/products/${productId}`),

  // Orders
  createOrder: (data: {
    items: { productId: string; quantity: number }[];
    couponCode?: string;
  }) =>
    apiClient.post('/store/orders', data),

  getOrders: () =>
    apiClient.get('/store/orders'),

  getOrderDetail: (orderId: string) =>
    apiClient.get(`/store/orders/${orderId}`),

  // Payments / Stripe
  createPaymentIntent: (data: {
    orderId: string;
    amount: number;
    currency?: string;
  }) =>
    apiClient.post('/store/payments/intent', data),

  confirmPayment: (data: {
    orderId: string;
    paymentIntentId: string;
  }) =>
    apiClient.post('/store/payments/confirm', data),

  // Course Checkout
  createCourseCheckout: (data: {
    courseId: string;
    tier: string;
  }) =>
    apiClient.post('/academy/courses/checkout', data),
};

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── EVENTS API ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const eventsApi = {
  // Events
  listEvents: () =>
    apiClient.get('/events').then((response) =>
      ((response?.events as Array<Record<string, unknown>> | undefined) ?? []).map((event) => ({
        ...event,
        slug: String(event.slug ?? ''),
        date: String(event.scheduledAt ?? ''),
        time: formatEventTime(String(event.scheduledAt ?? '')),
        duration: formatDuration(Number(event.durationMinutes ?? 0)),
        attendees: Number(event.currentAttendees ?? 0),
        price: Number(event.price ?? 0),
      }))
    ),

  getEventDetail: (eventId: string) =>
    apiClient.get(`/events/${eventId}`),

  // Registration
  registerEvent: (eventId: string, data?: { smsOptIn?: boolean }) =>
    apiClient.post(`/events/${eventId}/register`, data),

  getRegistrations: () =>
    apiClient.get('/events/my/registrations'),

  getRegistrationDetail: (registrationId: string) =>
    apiClient.get(`/events/registrations/${registrationId}`),

  // Video room
  getEventVideoRoom: (eventId: string) =>
    apiClient.get(`/events/events/${eventId}/video-room`),
};

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── COMMUNICATIONS API ───────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const commsApi = {
  // Admin endpoints
  sendAppointmentReminders: () =>
    apiClient.post('/comms/appointments/send-reminders'),

  sendEventReminders: () =>
    apiClient.post('/comms/events/send-reminders'),

  createEventVideoRoom: (eventId: string) =>
    apiClient.post(`/comms/events/${eventId}/video-room`),

  sendCourseEmail: (courseId: string, emailType: string) =>
    apiClient.post(`/comms/courses/${courseId}/email`, { emailType }),
};

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── ADMIN API ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const adminApi = {
  // Users Management
  listUsers: (page?: number, limit?: number, filters?: Record<string, unknown>) =>
    apiClient.get('/admin/users', {
      params: { page, limit, ...filters },
    }),

  getUserDetail: (userId: string) =>
    apiClient.get(`/admin/users/${userId}`),

  updateUser: (userId: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/users/${userId}`, data),

  deleteUser: (userId: string) =>
    apiClient.delete(`/admin/users/${userId}`),

  suspendUser: (userId: string) =>
    apiClient.post(`/admin/users/${userId}/suspend`),

  unsuspendUser: (userId: string) =>
    apiClient.post(`/admin/users/${userId}/unsuspend`),

  // Bookings Management
  listBookings: (page?: number, limit?: number, filters?: Record<string, unknown>) =>
    apiClient.get('/admin/bookings', {
      params: { page, limit, ...filters },
    }),

  getBookingDetail: (bookingId: string) =>
    apiClient.get(`/admin/bookings/${bookingId}`),

  updateBooking: (bookingId: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/bookings/${bookingId}`, data),

  confirmBooking: (bookingId: string) =>
    apiClient.post(`/admin/bookings/${bookingId}/confirm`),

  cancelBooking: (bookingId: string) =>
    apiClient.post(`/admin/bookings/${bookingId}/cancel`),

  // Store Management
  listProducts: (page?: number, limit?: number, filters?: Record<string, unknown>) =>
    apiClient.get('/admin/products', {
      params: { page, limit, ...filters },
    }),

  getProductDetail: (productId: string) =>
    apiClient.get(`/admin/products/${productId}`),

  createProduct: (data: Record<string, unknown>) =>
    apiClient.post('/admin/products', data),

  updateProduct: (productId: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/products/${productId}`, data),

  deleteProduct: (productId: string) =>
    apiClient.delete(`/admin/products/${productId}`),

  listOrders: (page?: number, limit?: number, filters?: Record<string, unknown>) =>
    apiClient.get('/admin/orders', {
      params: { page, limit, ...filters },
    }),

  getOrderDetail: (orderId: string) =>
    apiClient.get(`/admin/orders/${orderId}`),

  updateOrderStatus: (orderId: string, status: string) =>
    apiClient.put(`/admin/orders/${orderId}`, { status }),

  // Email Campaigns
  listCampaigns: (page?: number, limit?: number) =>
    apiClient.get('/admin/campaigns', {
      params: { page, limit },
    }),

  getCampaignDetail: (campaignId: string) =>
    apiClient.get(`/admin/campaigns/${campaignId}`),

  createCampaign: (data: Record<string, unknown>) =>
    apiClient.post('/admin/campaigns', data),

  updateCampaign: (campaignId: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/campaigns/${campaignId}`, data),

  sendCampaign: (campaignId: string) =>
    apiClient.post(`/admin/campaigns/${campaignId}/send`),

  deleteCampaign: (campaignId: string) =>
    apiClient.delete(`/admin/campaigns/${campaignId}`),

  listEmailTemplates: () =>
    apiClient.get('/admin/email-templates'),

  createEmailTemplate: (data: Record<string, unknown>) =>
    apiClient.post('/admin/email-templates', data),

  updateEmailTemplate: (templateId: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/email-templates/${templateId}`, data),

  // Analytics
  getAnalyticsSummary: (dateFrom?: string, dateTo?: string) =>
    apiClient.get('/admin/analytics/summary', {
      params: { dateFrom, dateTo },
    }),

  getRevenueChart: (period?: string) =>
    apiClient.get('/admin/analytics/revenue', {
      params: { period },
    }),

  getUsersChart: (period?: string) =>
    apiClient.get('/admin/analytics/users', {
      params: { period },
    }),

  getCohortAnalysis: () =>
    apiClient.get('/admin/analytics/cohorts'),

  getEngagementMetrics: () =>
    apiClient.get('/admin/analytics/engagement'),

  // Content Management
  listLessons: (page?: number, limit?: number, filters?: Record<string, unknown>) =>
    apiClient.get('/admin/lessons', {
      params: { page, limit, ...filters },
    }),

  getLessonDetail: (lessonId: string) =>
    apiClient.get(`/admin/lessons/${lessonId}`),

  createLesson: (data: Record<string, unknown>) =>
    apiClient.post('/admin/lessons', data),

  updateLesson: (lessonId: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/lessons/${lessonId}`, data),

  publishLesson: (lessonId: string) =>
    apiClient.post(`/admin/lessons/${lessonId}/publish`),

  unPublishLesson: (lessonId: string) =>
    apiClient.post(`/admin/lessons/${lessonId}/unpublish`),

  deleteLesson: (lessonId: string) =>
    apiClient.delete(`/admin/lessons/${lessonId}`),

  // Reviews & Testimonials
  listReviews: (page?: number, limit?: number, filters?: Record<string, unknown>) =>
    apiClient.get('/admin/reviews', {
      params: { page, limit, ...filters },
    }),

  getReviewDetail: (reviewId: string) =>
    apiClient.get(`/admin/reviews/${reviewId}`),

  approveReview: (reviewId: string) =>
    apiClient.post(`/admin/reviews/${reviewId}/approve`),

  rejectReview: (reviewId: string) =>
    apiClient.post(`/admin/reviews/${reviewId}/reject`),

  featureReview: (reviewId: string) =>
    apiClient.post(`/admin/reviews/${reviewId}/feature`),

  unfeatureReview: (reviewId: string) =>
    apiClient.post(`/admin/reviews/${reviewId}/unfeature`),

  respondToReview: (reviewId: string, response: string) =>
    apiClient.post(`/admin/reviews/${reviewId}/respond`, { response }),

  deleteReview: (reviewId: string) =>
    apiClient.delete(`/admin/reviews/${reviewId}`),

  // Settings
  getSettings: () =>
    apiClient.get('/admin/settings'),

  updateSettings: (data: Record<string, unknown>) =>
    apiClient.put('/admin/settings', data),

  listPricingTiers: () =>
    apiClient.get('/admin/pricing-tiers'),

  createPricingTier: (data: Record<string, unknown>) =>
    apiClient.post('/admin/pricing-tiers', data),

  updatePricingTier: (tierId: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/pricing-tiers/${tierId}`, data),

  deletePricingTier: (tierId: string) =>
    apiClient.delete(`/admin/pricing-tiers/${tierId}`),

  // Audit Logs
  listAuditLogs: (page?: number, limit?: number, filters?: Record<string, unknown>) =>
    apiClient.get('/admin/audit-logs', {
      params: { page, limit, ...filters },
    }),

  listLoginHistory: (page?: number, limit?: number) =>
    apiClient.get('/admin/login-history', {
      params: { page, limit },
    }),

  // Search
  search: (query: string, type?: string) =>
    apiClient.get('/admin/search', {
      params: { q: query, type },
    }),

  listSearchPresets: () =>
    apiClient.get('/admin/search-presets'),

  createSearchPreset: (data: Record<string, unknown>) =>
    apiClient.post('/admin/search-presets', data),

  deleteSearchPreset: (presetId: string) =>
    apiClient.delete(`/admin/search-presets/${presetId}`),

  // Bulk Actions & Exports
  exportData: (dataType: string, format: string, filters?: Record<string, unknown>) =>
    apiClient.post('/admin/export', { dataType, format, filters }, {
      responseType: 'blob',
    }),

  listExports: () =>
    apiClient.get('/admin/exports'),

  getExportDetail: (exportId: string) =>
    apiClient.get(`/admin/exports/${exportId}`),

  deleteExport: (exportId: string) =>
    apiClient.delete(`/admin/exports/${exportId}`),

  listScheduledReports: () =>
    apiClient.get('/admin/scheduled-reports'),

  createScheduledReport: (data: Record<string, unknown>) =>
    apiClient.post('/admin/scheduled-reports', data),

  updateScheduledReport: (reportId: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/scheduled-reports/${reportId}`, data),

  deleteScheduledReport: (reportId: string) =>
    apiClient.delete(`/admin/scheduled-reports/${reportId}`),

  // Bulk operations
  bulkUpdateUsers: (userIds: string[], data: Record<string, unknown>) =>
    apiClient.post('/admin/bulk/users', { userIds, data }),

  bulkDeleteUsers: (userIds: string[]) =>
    apiClient.post('/admin/bulk/users/delete', { userIds }),

  bulkUpdateProducts: (productIds: string[], data: Record<string, unknown>) =>
    apiClient.post('/admin/bulk/products', { productIds, data }),

  bulkDeleteProducts: (productIds: string[]) =>
    apiClient.post('/admin/bulk/products/delete', { productIds }),
};

