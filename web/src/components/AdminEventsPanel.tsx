import { useState, useEffect } from 'react';
import { eventsApi } from '@/lib/api';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  type?: string;
  attendees: number;
  price: number;
  description?: string;
  status?: string;
}

export default function AdminEventsPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = (await eventsApi.listEvents()) as unknown as Event[];
      setEvents(data || []);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load events';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      // TODO: Add deleteEvent to API
      console.log('Delete event:', eventId);
      await loadEvents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete event';
      setError(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div
            className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#C9A84C' }}
          />
          <p style={{ color: '#704214', fontFamily: 'DM Sans, sans-serif' }}>Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="px-6 py-4 rounded"
        style={{
          backgroundColor: 'rgba(160, 82, 45, 0.15)',
          border: '1px solid #A0522D',
          color: '#E8DCBE',
        }}
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Manage Events
        </h2>
        <button
          className="px-4 py-2 rounded font-medium text-sm"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            backgroundColor: '#C9A84C',
            color: '#2C1810',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          + New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div
          className="py-12 text-center rounded"
          style={{ backgroundColor: '#2C1810', border: '1px solid #3D2B1F' }}
        >
          <p style={{ color: '#704214', fontFamily: '"Libre Baskerville", serif' }}>
            No events found. Create your first event to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #3D2B1F' }}>
                <th className="text-left p-3" style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
                  EVENT
                </th>
                <th className="text-left p-3" style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
                  DATE & TIME
                </th>
                <th className="text-left p-3" style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
                  TYPE
                </th>
                <th className="text-right p-3" style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
                  ATTENDEES
                </th>
                <th className="text-right p-3" style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
                  PRICE
                </th>
                <th className="text-right p-3" style={{ color: '#C9A84C', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  style={{
                    borderBottom: '1px solid #3D2B1F',
                    backgroundColor: '#2C1810',
                  }}
                >
                  <td className="p-3">
                    <div>
                      <p style={{ color: '#F5ECD7', fontWeight: 600 }}>{event.title}</p>
                      <p style={{ color: '#704214', fontSize: '0.85rem' }}>{event.duration}</p>
                    </div>
                  </td>
                  <td className="p-3" style={{ color: '#8B5E3C' }}>
                    <div>
                      <p>{event.date}</p>
                      <p style={{ fontSize: '0.85rem' }}>{event.time}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: '#3D2B1F',
                        color: '#C9A84C',
                        textTransform: 'uppercase',
                      }}
                    >
                      {event.type || 'event'}
                    </span>
                  </td>
                  <td className="p-3 text-right" style={{ color: '#E8DCBE', fontWeight: 600 }}>
                    {event.attendees}
                  </td>
                  <td className="p-3 text-right" style={{ color: '#C9A84C', fontWeight: 700 }}>
                    ${event.price === 0 ? 'FREE' : event.price}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="px-2 py-1 text-xs font-medium rounded"
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          backgroundColor: '#3D2B1F',
                          color: '#C9A84C',
                          border: '1px solid #3D2B1F',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="px-2 py-1 text-xs font-medium rounded"
                        style={{
                          fontFamily: 'DM Sans, sans-serif',
                          backgroundColor: '#3D2B1F',
                          color: '#A0522D',
                          border: '1px solid #3D2B1F',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
