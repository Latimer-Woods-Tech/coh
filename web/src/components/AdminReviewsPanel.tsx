/**
 * AdminReviewsPanel - User Reviews & Testimonials Management
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable, { Column } from '@/components/DataTable';
import FilterPanel, { FilterField } from '@/components/FilterPanel';
import Pagination from '@/components/Pagination';
import { Review, PaginationState } from '@/types/admin';

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Featured', value: 'featured' },
];

export default function AdminReviewsPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const loadReviews = async (page: number = 1, currentFilters?: Record<string, unknown>) => {
    try {
      setIsLoading(true);
      const response = (await adminApi.listReviews(
        page,
        pagination.limit,
        currentFilters || filters
      )) as any;
      setReviews(response.data || []);
      setPagination(response.pagination || { page, limit: pagination.limit, total: 0, totalPages: 0 });
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load reviews';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleApproveReview = async (reviewId: string) => {
    try {
      await adminApi.approveReview(reviewId);
      await loadReviews(pagination.page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to approve review';
      setError(msg);
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      await adminApi.rejectReview(reviewId);
      await loadReviews(pagination.page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reject review';
      setError(msg);
    }
  };

  const handleFeatureReview = async (reviewId: string) => {
    try {
      await adminApi.featureReview(reviewId);
      await loadReviews(pagination.page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to feature review';
      setError(msg);
    }
  };

  const columns: Column<Review>[] = [
    {
      key: 'userName',
      label: 'Reviewer',
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
      key: 'rating',
      label: 'Rating',
      width: '80px',
      align: 'center',
      render: (value) => (
        <span style={{ color: '#C9A84C', fontWeight: 'bold', fontSize: '1.1rem' }}>
          {'⭐'.repeat(Number(value))}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (value, row) => (
        <div>
          <p style={{ fontWeight: 600 }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: '#8B5E3C', height: '2rem' }}>
            {row.comment.substring(0, 80)}...
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{
            backgroundColor:
              value === 'approved'
                ? 'rgba(76, 175, 80, 0.2)'
                : value === 'featured'
                  ? 'rgba(201, 168, 76, 0.2)'
                  : value === 'rejected'
                    ? 'rgba(244, 67, 54, 0.2)'
                    : 'rgba(255, 152, 0, 0.2)',
            color:
              value === 'approved'
                ? '#4CAF50'
                : value === 'featured'
                  ? '#C9A84C'
                  : value === 'rejected'
                    ? '#F44336'
                    : '#FF9800',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => new Date(value as string).toLocaleDateString(),
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
      placeholder: 'Reviewer name...',
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Reviews & Testimonials
        </h2>
        <div className="text-sm" style={{ color: '#704214' }}>
          Pending: <span style={{ color: '#C9A84C', fontWeight: 700 }}>
            {reviews.filter((r) => r.status === 'pending').length}
          </span>
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
        onFilter={(newFilters) => {
          setFilters(newFilters);
          loadReviews(1, newFilters);
        }}
        onClear={() => {
          setFilters({});
          loadReviews(1, {});
        }}
      />

      <DataTable<Review>
        columns={columns}
        data={reviews}
        isLoading={isLoading}
        actions={[
          {
            label: 'Approve',
            icon: '✓',
            onClick: (review) =>
              review.status === 'pending' && handleApproveReview(review.id),
            variant: 'secondary',
          },
          {
            label: 'Feature',
            icon: '⭐',
            onClick: (review) => handleFeatureReview(review.id),
            variant: 'secondary',
          },
          {
            label: 'Delete',
            icon: '🗑',
            onClick: (review) => handleRejectReview(review.id),
            variant: 'danger',
          },
        ]}
        emptyMessage="No reviews found"
      />

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={(page) => loadReviews(page)}
        onPageSizeChange={(size) => {
          setPagination((prev) => ({ ...prev, limit: size }));
          loadReviews(1);
        }}
      />
    </div>
  );
}
