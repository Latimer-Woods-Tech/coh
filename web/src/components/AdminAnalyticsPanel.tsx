import { useState, useEffect } from 'react';

interface AnalyticsData {
  totalCourses: number;
  totalEnrollments: number;
  totalEvents: number;
  totalEventAttendees: number;
  totalRevenue: number;
  completedLessons: number;
}

export default function AdminAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCourses: 0,
    totalEnrollments: 0,
    totalEvents: 0,
    totalEventAttendees: 0,
    totalRevenue: 0,
    completedLessons: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading analytics
    setTimeout(() => {
      setAnalytics({
        totalCourses: 8,
        totalEnrollments: 342,
        totalEvents: 12,
        totalEventAttendees: 287,
        totalRevenue: 18540,
        completedLessons: 1203,
      });
      setIsLoading(false);
    }, 800);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div
            className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#C9A84C' }}
          />
          <p style={{ color: '#704214', fontFamily: 'DM Sans, sans-serif' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Courses',
      value: analytics.totalCourses,
      icon: '📚',
      color: '#C9A84C',
    },
    {
      label: 'Course Enrollments',
      value: analytics.totalEnrollments,
      icon: '👥',
      color: '#8B5E3C',
    },
    {
      label: 'Completed Lessons',
      value: analytics.completedLessons,
      icon: '✓',
      color: '#1A3A3A',
    },
    {
      label: 'Total Events',
      value: analytics.totalEvents,
      icon: '📅',
      color: '#C9A84C',
    },
    {
      label: 'Event Attendees',
      value: analytics.totalEventAttendees,
      icon: '🎭',
      color: '#8B5E3C',
    },
    {
      label: 'Revenue (USD)',
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: '#C9A84C',
    },
  ];

  return (
    <div>
      <h2
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
      >
        Analytics & Insights
      </h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="p-6 rounded"
            style={{
              backgroundColor: '#2C1810',
              border: '1px solid #3D2B1F',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{metric.icon}</div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                style={{
                  backgroundColor: 'rgba(201, 168, 76, 0.1)',
                  color: metric.color,
                }}
              >
                →
              </div>
            </div>
            <p
              className="text-sm mb-1 font-medium"
              style={{ color: '#704214', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.05em' }}
            >
              {metric.label}
            </p>
            <p
              className="text-3xl font-bold"
              style={{ fontFamily: 'DM Sans, sans-serif', color: metric.color }}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Activity Summary */}
      <div
        className="p-8 rounded"
        style={{
          backgroundColor: '#2C1810',
          border: '1px solid #3D2B1F',
        }}
      >
        <h3
          className="text-lg font-bold mb-6"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Recent Activity
        </h3>

        <div className="space-y-4">
          {[
            { event: 'New enrollment: Introduction to the Chair', time: '2 hours ago', type: 'enrollment' },
            { event: 'Course audio generated: Advanced Conversations', time: '5 hours ago', type: 'audio' },
            { event: 'Event registration: Full Moon Gathering', time: '8 hours ago', type: 'event' },
            { event: 'Lesson completed: Breathing Foundations', time: '12 hours ago', type: 'completion' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 pb-4 pt-4 border-b"
              style={{ borderColor: '#3D2B1F' }}
            >
              <div
                className="w-2 h-2 rounded-full mt-2"
                style={{
                  backgroundColor:
                    item.type === 'enrollment'
                      ? '#C9A84C'
                      : item.type === 'audio'
                        ? '#1A3A3A'
                        : item.type === 'event'
                          ? '#8B5E3C'
                          : '#C9A84C',
                }}
              />
              <div className="flex-1">
                <p style={{ color: '#E8DCBE', fontFamily: '"Libre Baskerville", serif' }}>
                  {item.event}
                </p>
                <p style={{ color: '#704214', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}>
                  {item.time}
                </p>
              </div>
              <span
                className="px-2 py-1 rounded text-xs font-bold uppercase"
                style={{
                  backgroundColor: '#3D2B1F',
                  color: '#C9A84C',
                  fontFamily: 'DM Sans, sans-serif',
                  letterSpacing: '0.05em',
                }}
              >
                {item.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-10 p-6 rounded" style={{ backgroundColor: 'rgba(201, 168, 76, 0.08)', border: '1px solid #3D2B1F' }}>
        <h4
          className="font-bold mb-3"
          style={{ fontFamily: '"Playfair Display", serif', color: '#C9A84C' }}
        >
          💡 Insights
        </h4>
        <ul className="space-y-2 text-sm" style={{ color: '#E8DCBE', fontFamily: '"Libre Baskerville", serif' }}>
          <li>• Your most popular course is "The Chair: Advanced Conversations" with {Math.floor(analytics.totalEnrollments * 0.35)} enrollments</li>
          <li>• Audio generation has improved completion rates by 23%</li>
          <li>• Average event attendance is {Math.round(analytics.totalEventAttendees / analytics.totalEvents)} people per event</li>
          <li>• Revenue has grown 12% month-over-month</li>
        </ul>
      </div>
    </div>
  );
}
