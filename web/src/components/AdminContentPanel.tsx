/**
 * AdminContentPanel - Course & Lesson Content Management
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable, { Column } from '@/components/DataTable';
import FilterPanel, { FilterField } from '@/components/FilterPanel';
import Pagination from '@/components/Pagination';
import { AdminLesson, PaginationState } from '@/types/admin';

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

const CONTENT_TYPE_OPTIONS = [
  { label: 'Text', value: 'text' },
  { label: 'Video', value: 'video' },
  { label: 'Audio', value: 'audio' },
  { label: 'Interactive', value: 'interactive' },
];

export default function AdminContentPanel() {
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const loadLessons = async (page: number = 1, currentFilters?: Record<string, unknown>) => {
    try {
      setIsLoading(true);
      const response = (await adminApi.listLessons(
        page,
        pagination.limit,
        currentFilters || filters
      )) as any;
      setLessons(response.data || []);
      setPagination(response.pagination || { page, limit: pagination.limit, total: 0, totalPages: 0 });
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load lessons';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  const handlePublishLesson = async (lessonId: string) => {
    try {
      await adminApi.publishLesson(lessonId);
      await loadLessons(pagination.page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish lesson';
      setError(msg);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      try {
        await adminApi.deleteLesson(lessonId);
        await loadLessons(pagination.page);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete lesson';
        setError(msg);
      }
    }
  };

  const columns: Column<AdminLesson>[] = [
    {
      key: 'title',
      label: 'Lesson',
      sortable: true,
      render: (value, row) => (
        <div>
          <p style={{ fontWeight: 600, color: '#F5ECD7' }}>{value}</p>
          <p className="text-xs" style={{ color: '#704214' }}>
            {row.courseName}
          </p>
        </div>
      ),
    },
    {
      key: 'moduleName',
      label: 'Module',
      render: (value) => value || '—',
    },
    {
      key: 'contentType',
      label: 'Type',
      render: (value) => (
        <span
          style={{
            backgroundColor: '#3D2B1F',
            color: '#C9A84C',
            padding: '0.25rem 0.75rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
          }}
        >
          {value}
        </span>
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
              value === 'published'
                ? 'rgba(76, 175, 80, 0.2)'
                : value === 'draft'
                  ? 'rgba(255, 152, 0, 0.2)'
                  : 'rgba(200, 200, 200, 0.2)',
            color:
              value === 'published'
                ? '#4CAF50'
                : value === 'draft'
                  ? '#FF9800'
                  : '#999',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
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
      id: 'contentType',
      label: 'Content Type',
      type: 'select',
      options: CONTENT_TYPE_OPTIONS,
    },
    {
      id: 'searchTerm',
      label: 'Search',
      type: 'text',
      placeholder: 'Lesson title...',
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Content Management
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
          + New Lesson
        </button>
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
          loadLessons(1, newFilters);
        }}
        onClear={() => {
          setFilters({});
          loadLessons(1, {});
        }}
      />

      <DataTable<AdminLesson>
        columns={columns}
        data={lessons}
        isLoading={isLoading}
        actions={[
          {
            label: 'Edit',
            icon: '✎',
            onClick: () => {},
            variant: 'secondary',
          },
          {
            label: 'Publish',
            icon: '✓',
            onClick: (lesson) =>
              lesson.status === 'draft' && handlePublishLesson(lesson.id),
            variant: 'secondary',
          },
          {
            label: 'Delete',
            icon: '🗑',
            onClick: (lesson) => handleDeleteLesson(lesson.id),
            variant: 'danger',
          },
        ]}
        emptyMessage="No lessons found"
      />

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={(page) => loadLessons(page)}
        onPageSizeChange={(size) => {
          setPagination((prev) => ({ ...prev, limit: size }));
          loadLessons(1);
        }}
      />
    </div>
  );
}
