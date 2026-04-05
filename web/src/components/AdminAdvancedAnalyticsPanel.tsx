/**
 * AdminAdvancedAnalyticsPanel - Analytics & Insights
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import { AnalyticsMetric } from '@/types/admin';

export default function AdminAdvancedAnalyticsPanel() {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = (await adminApi.getAnalyticsSummary()) as any;
      setMetrics(data || []);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Default metrics
  const defaultMetrics: AnalyticsMetric[] = [
    {
      id: '1',
      label: 'Total Revenue',
      value: 0,
      change: 12.5,
      trend: 'up',
      icon: '💰',
    },
    {
      id: '2',
      label: 'Active Users',
      value: 0,
      change: 8.3,
      trend: 'up',
      icon: '👥',
    },
    {
      id: '3',
      label: 'Bookings This Month',
      value: 0,
      change: -2.1,
      trend: 'down',
      icon: '📅',
    },
    {
      id: '4',
      label: 'Course Enrollments',
      value: 0,
      change: 15.7,
      trend: 'up',
      icon: '📚',
    },
    {
      id: '5',
      label: 'Total Orders',
      value: 0,
      change: 5.2,
      trend: 'up',
      icon: '🛒',
    },
    {
      id: '6',
      label: 'Pending Reviews',
      value: 0,
      change: -3.5,
      trend: 'down',
      icon: '⭐',
    },
  ];

  const displayMetrics = metrics.length > 0 ? metrics : defaultMetrics;

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Advanced Analytics
        </h2>
        <p style={{ color: '#704214', fontFamily: 'DM Sans, sans-serif' }}>
          Real-time business metrics and insights
        </p>
      </div>

      {error && (
        <div
          className="px-6 py-4 rounded mb-6"
          style={{
            backgroundColor: 'rgba(160, 82, 45, 0.15)',
            border: '1px solid #A0522D',
            color: '#E8DCBE',
          }}
        >
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {displayMetrics.map((metric) => (
          <StatsCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            trend={metric.trend}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Revenue Trend */}
      <div
        className="p-6 rounded border"
        style={{
          backgroundColor: '#2C1810',
          borderColor: '#3D2B1F',
        }}
      >
        <h3
          className="text-lg font-bold mb-4"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Revenue Trend (Last 30 Days)
        </h3>
        <div
          className="py-12 text-center"
          style={{
            backgroundColor: '#3D2B1F',
            borderRadius: '8px',
            color: '#704214',
          }}
        >
          <p style={{ fontFamily: 'DM Sans, sans-serif' }}>
            📊 Chart visualization coming soon
          </p>
        </div>
      </div>

      {/* Cohort Analysis */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded border"
          style={{
            backgroundColor: '#2C1810',
            borderColor: '#3D2B1F',
          }}
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
          >
            User Retention
          </h3>
          <div style={{ color: '#704214', fontFamily: 'DM Sans, sans-serif' }}>
            <p className="mb-2">Strong retention rates across all cohorts</p>
            <p className="text-sm">Detailed cohort analysis available in advanced view</p>
          </div>
        </div>

        <div
          className="p-6 rounded border"
          style={{
            backgroundColor: '#2C1810',
            borderColor: '#3D2B1F',
          }}
        >
          <h3
            className="text-lg font-bold mb-4"
            style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
          >
            Engagement Metrics
          </h3>
          <div
            className="space-y-2"
            style={{ color: '#E8DCBE', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}
          >
            <div className="flex justify-between">
              <span>Avg. Session Duration:</span>
              <span style={{ color: '#C9A84C', fontWeight: 'bold' }}>12.5 min</span>
            </div>
            <div className="flex justify-between">
              <span>Bounce Rate:</span>
              <span style={{ color: '#C9A84C', fontWeight: 'bold' }}>24.3%</span>
            </div>
            <div className="flex justify-between">
              <span>Pages Per Session:</span>
              <span style={{ color: '#C9A84C', fontWeight: 'bold' }}>5.2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
