import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import StorePage from './pages/StorePage';
import AcademyPage from './pages/AcademyPage';
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
        <Route element={<Layout><EventsPage /></Layout>} path="/events" />
        <Route element={<LoginPage />} path="/login" />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
