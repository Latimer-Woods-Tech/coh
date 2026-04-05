import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import StorePage from './pages/StorePage';
import AcademyPage from './pages/AcademyPage';
import CoursePage from './pages/CoursePage';
import LessonPage from './pages/LessonPage';
import AdminCoursePage from './pages/AdminCoursePage';
import AdminPage from './pages/AdminPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout><HomePage /></Layout>} path="/" />
        <Route element={<Layout><BookingPage /></Layout>} path="/booking" />
        <Route element={<Layout><StorePage /></Layout>} path="/store" />
        <Route element={<Layout><AcademyPage /></Layout>} path="/academy" />
        <Route element={<Layout><CoursePage /></Layout>} path="/academy/:slug" />
        <Route element={<LessonPage />} path="/academy/:courseSlug/:lessonId" />
        <Route element={<Layout><AdminCoursePage /></Layout>} path="/admin/courses" />
        <Route element={<AdminPage />} path="/admin" />
        <Route element={<Layout><EventsPage /></Layout>} path="/events" />
        <Route element={<LoginPage />} path="/login" />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
