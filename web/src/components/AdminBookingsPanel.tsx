/**
 * AdminBookingsPanel - Booking/Appointment Management
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable, { Column } from '@/components/DataTable';
import FilterPanel, { FilterField } from '@/components/FilterPanel';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { AdminBooking, BookingFilter, PaginationState } from '@/types/admin';

const STATUS_OPTIONS = [
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Completed', value: 'completed' },
];

export default function AdminBookingsPanel() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<BookingFilter>({});
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load bookings
  const loadBookings = async (page: number = 1, currentFilters?: BookingFilter) => {
    try {
      setIsLoading(true);
      const response = (await adminApi.listBookings(
        page,
        pagination.limit,
        currentFilters || filters
      )) as any;
      setBookings(response.data || []);
      setPagination(response.pagination || { page, limit: pagination.limit, total: 0, totalPages: 0 });
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load bookings';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleFilter = (newFilters: Record<string, unknown>) => {
    const typedFilters: BookingFilter = {
      status: newFilters.status as string,
      serviceId: newFilters.serviceId as string,
      searchTerm: newFilters.searchTerm as string,
    };
    setFilters(typedFilters);
    loadBookings(1, typedFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    loadBookings(1, {});
  };

  const handlePageChange = (page: number) => {
    loadBookings(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, limit: size }));
    loadBookings(1);
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await adminApi.confirmBooking(bookingId);
      await loadBookings(pagination.page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm booking';
      setError(msg);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await adminApi.cancelBooking(bookingId);
        await loadBookings(pagination.page);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to cancel booking';
        setError(msg);
      }
    }
  };

  const columns: Column<AdminBooking>[] = [
    {
      key: 'userName',
      label: 'Client',
      sortable: true,
      render: (value, row) => (
        <div>
          <p style={{ fontWeight: 600, color: '#F5ECD7' }}>{value}</p>
          <p className="text-xs" style={{ color: '#704214' }}>
            {row.userEmail}
          </p>
        </div>
      ),
    },
    {
      key: 'serviceName',
      label: 'Service',
      sortable: true,
    },
    {
      key: 'scheduledAt',
      label: 'Date & Time',
      render: (value) => (
        <div>
          <p>{new Date(value as string).toLocaleDateString()}</p>
          <p className="text-xs" style={{ color: '#704214' }}>
            {new Date(value as string).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (value) => (
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{
            backgroundColor:
              value === 'confirmed'
                ? 'rgba(76, 175, 80, 0.2)'
                : value === 'pending'
                  ? 'rgba(255, 152, 0, 0.2)'
                  : value === 'completed'
                    ? 'rgba(33, 150, 243, 0.2)'
                    : 'rgba(244, 67, 54, 0.2)',
            color:
              value === 'confirmed'
                ? '#4CAF50'
                : value === 'pending'
                  ? '#FF9800'
                  : value === 'completed'
                    ? '#2196F3'
                    : '#F44336',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      width: '80px',
      align: 'center',
      render: (value) => `${value}m`,
    },
  ];

  const filterFields: FilterField[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: STATUS_OPTIONS,
    },
    {
      id: 'searchTerm',
      label: 'Search',
      type: 'text',
      placeholder: 'Client name or email...',
    },
    {
      id: 'dateFrom',
      label: 'From Date',
      type: 'date',
    },
    {
      id: 'dateTo',
      label: 'To Date',
      type: 'date',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Bookings & Appointments
        </h2>
        <div className="text-sm" style={{ color: '#704214' }}>
          Total: <span style={{ color: '#C9A84C', fontWeight: 700 }}>{pagination.total}</span>
        </div>
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

      <FilterPanel
        fields={filterFields}
        onFilter={handleFilter}
        onClear={handleClearFilters}
      />

      <DataTable<AdminBooking>
        columns={columns}
        data={bookings}
        isLoading={isLoading}
        actions={[
          {
            label: 'Confirm',
            icon: '✓',
            onClick: (booking) =>
              booking.status === 'pending' && handleConfirmBooking(booking.id),
            variant: 'secondary',
          },
          {
            label: 'Cancel',
            icon: '✕',
            onClick: (booking) => handleCancelBooking(booking.id),
            variant: 'danger',
          },
        ]}
        emptyMessage="No bookings found"
        maxHeight="600px"
      />

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
