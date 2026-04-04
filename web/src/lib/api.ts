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

// ─── Lesson API helpers ───
export const lessonApi = {
  // Get a specific lesson with full content (video, audio, transcript)
  getLesson: (lessonId: string) =>
    apiClient.get(`/academy/lessons/${lessonId}`),

  // Get all lessons for a course
  getLessonsForCourse: (courseId: string) =>
    apiClient.get(`/academy/courses/${courseId}/lessons`),

  // Mark lesson as complete
  completeLesson: (lessonId: string, watchTimeSeconds: number = 0) =>
    apiClient.post(`/academy/lessons/${lessonId}/complete`, {
      watchTimeSeconds,
    }),

  // Get lesson transcript
  getTranscript: (lessonId: string) =>
    apiClient.get(`/academy/lessons/${lessonId}/transcript`),

  // Stream audio (returns a Promise<Blob> for playback)
  getAudioStream: async (audioUrl: string) => {
    const response = await axios.get(audioUrl, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ─── Communications API helpers ───
export const commsApi = {
  // Send appointment reminders (admin only)
  sendAppointmentReminders: () =>
    apiClient.post('/comms/appointments/send-reminders'),

  // Send event reminders (admin only)
  sendEventReminders: () =>
    apiClient.post('/comms/events/send-reminders'),

  // Create video room for event (admin only)
  createEventVideoRoom: (eventId: string) =>
    apiClient.post(`/comms/events/${eventId}/video-room`),

  // Get video room token for event (user)
  getEventVideoRoom: (eventId: string) =>
    apiClient.get(`/comms/events/${eventId}/video-room`),
};
