import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import AdminCoursesPanel from '@/components/AdminCoursesPanel';
import AdminEventsPanel from '@/components/AdminEventsPanel';
import AdminAnalyticsPanel from '@/components/AdminAnalyticsPanel';
import AdminUsersPanel from '@/components/AdminUsersPanel';
import AdminBookingsPanel from '@/components/AdminBookingsPanel';
import AdminStorePanel from '@/components/AdminStorePanel';
import AdminEmailPanel from '@/components/AdminEmailPanel';
import AdminAdvancedAnalyticsPanel from '@/components/AdminAdvancedAnalyticsPanel';
import AdminContentPanel from '@/components/AdminContentPanel';
import AdminReviewsPanel from '@/components/AdminReviewsPanel';
import AdminSettingsPanel from '@/components/AdminSettingsPanel';
import AdminAuditPanel from '@/components/AdminAuditPanel';
import AdminSearchPanel from '@/components/AdminSearchPanel';
import AdminExportPanel from '@/components/AdminExportPanel';

type AdminTab =
  | 'users'
  | 'bookings'
  | 'store'
  | 'email'
  | 'analytics'
  | 'content'
  | 'reviews'
  | 'settings'
  | 'logs'
  | 'search'
  | 'exports'
  | 'courses'
  | 'events';

const ADMIN_TABS: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'bookings', label: 'Bookings', icon: '📅' },
  { id: 'store', label: 'Store', icon: '🛒' },
  { id: 'email', label: 'Email', icon: '✉️' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'content', label: 'Content', icon: '📝' },
  { id: 'reviews', label: 'Reviews', icon: '⭐' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'logs', label: 'Logs', icon: '📋' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'exports', label: 'Exports', icon: '📥' },
  { id: 'courses', label: 'Courses', icon: '📚' },
  { id: 'events', label: 'Events', icon: '📌' },
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null; // Should redirect above, but just in case
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0E09' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 px-6 py-4 border-b flex items-center justify-between"
        style={{
          backgroundColor: '#2C1810',
          borderColor: '#3D2B1F',
        }}
      >
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Admin Dashboard
        </h1>
        <div className="text-sm" style={{ color: '#704214' }}>
          Welcome, <span style={{ color: '#C9A84C', fontWeight: 700 }}>{user.name}</span>
        </div>
      </header>

      {/* Tabs - Scrollable */}
      <nav
        className="sticky top-20 z-30 overflow-x-auto border-b px-6 pt-6"
        style={{
          backgroundColor: '#1A0E09',
          borderColor: '#3D2B1F',
        }}
      >
        <div className="flex gap-0 whitespace-nowrap">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-3 font-medium text-sm uppercase tracking-wider transition-colors"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                color: activeTab === tab.id ? '#C9A84C' : '#704214',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #C9A84C' : 'none',
                letterSpacing: '0.1em',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        {activeTab === 'users' && <AdminUsersPanel />}
        {activeTab === 'bookings' && <AdminBookingsPanel />}
        {activeTab === 'store' && <AdminStorePanel />}
        {activeTab === 'email' && <AdminEmailPanel />}
        {activeTab === 'analytics' && <AdminAdvancedAnalyticsPanel />}
        {activeTab === 'content' && <AdminContentPanel />}
        {activeTab === 'reviews' && <AdminReviewsPanel />}
        {activeTab === 'settings' && <AdminSettingsPanel />}
        {activeTab === 'logs' && <AdminAuditPanel />}
        {activeTab === 'search' && <AdminSearchPanel />}
        {activeTab === 'exports' && <AdminExportPanel />}
        {activeTab === 'courses' && <AdminCoursesPanel />}
        {activeTab === 'events' && <AdminEventsPanel />}
      </main>
    </div>
  );
}
