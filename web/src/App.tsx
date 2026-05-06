import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';

const AboutPage = lazy(() => import('./pages/AboutPage'));
const BooksPage = lazy(() => import('./pages/BooksPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const AcademyPage = lazy(() => import('./pages/AcademyPage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const AdminCoursePage = lazy(() => import('./pages/AdminCoursePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const FounderPage = lazy(() => import('./pages/FounderPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ShowPage = lazy(() => import('./pages/ShowPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));

function RouteFallback() {
  return (
    <div
      className="min-h-[40vh] flex items-center justify-center"
      style={{ backgroundColor: '#F5ECD7' }}
    >
      <div
        className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout><HomePage /></Layout>} path="/" />
          <Route element={<Layout><AboutPage /></Layout>} path="/about" />
          <Route element={<Layout><FounderPage /></Layout>} path="/founder" />
          <Route element={<Layout><BooksPage /></Layout>} path="/books" />
          <Route element={<Layout><ShowPage /></Layout>} path="/show" />
          <Route element={<Layout><BookingPage /></Layout>} path="/booking" />
          <Route element={<Layout><StorePage /></Layout>} path="/store" />
          <Route element={<Layout><AcademyPage /></Layout>} path="/academy" />
          <Route element={<Layout><CoursePage /></Layout>} path="/academy/:slug" />
          <Route element={<LessonPage />} path="/academy/:courseSlug/:lessonId" />
          <Route element={<Layout><AdminCoursePage /></Layout>} path="/admin/courses" />
          <Route element={<AdminPage />} path="/admin" />
          <Route element={<Layout><DisclaimerPage /></Layout>} path="/disclaimer" />
          <Route element={<Layout><EventsPage /></Layout>} path="/events" />
          <Route element={<LoginPage />} path="/login" />
          <Route element={<SignupPage />} path="/signup" />
          <Route element={<Layout><ProfilePage /></Layout>} path="/profile" />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
