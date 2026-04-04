import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Use replace to avoid pushing a new history entry
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

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── AUTHENTICATION API ───────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const authApi = {
  signup: (data: { email: string; password: string; name: string }) =>
    apiClient.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  refreshToken: () =>
    apiClient.post('/auth/refresh-token'),

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
    apiClient.get('/academy/courses'),

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
};

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── BOOKING API ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const bookingApi = {
  // Services
  listServices: () =>
    apiClient.get('/booking/services'),

  getServiceDetail: (serviceId: string) =>
    apiClient.get(`/booking/services/${serviceId}`),

  // Availability
  getAvailability: (serviceId: string, startDate?: string) =>
    apiClient.get(`/booking/services/${serviceId}/availability`, {
      params: { startDate },
    }),

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
    apiClient.post(`/booking/appointments/${appointmentId}/cancel`),
};

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── STORE API ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const storeApi = {
  // Categories
  listCategories: () =>
    apiClient.get('/store/categories'),

  getCategoryDetail: (categoryId: string) =>
    apiClient.get(`/store/categories/${categoryId}`),

  // Products
  listProducts: (categoryId?: string) =>
    apiClient.get('/store/products', {
      params: categoryId ? { categoryId } : undefined,
    }),

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
};

// ═══════════════════════════════════════════════════════════════════
// ─────────────────── EVENTS API ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export const eventsApi = {
  // Events
  listEvents: () =>
    apiClient.get('/events/events'),

  getEventDetail: (eventId: string) =>
    apiClient.get(`/events/events/${eventId}`),

  // Registration
  registerEvent: (eventId: string, data?: { smsOptIn?: boolean }) =>
    apiClient.post(`/events/events/${eventId}/register`, data),

  getRegistrations: () =>
    apiClient.get('/events/registrations'),

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
