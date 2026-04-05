/**
 * DataTable Component
 * Reusable table component for all admin data displays
 */

import React, { useMemo } from 'react';

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  actions?: Array<{
    label: string;
    icon?: string;
    onClick: (row: T) => void;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
  isLoading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
  striped?: boolean;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  actions,
  isLoading,
  emptyMessage = 'No data available',
  maxHeight = '600px',
  striped = true,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  React.useEffect(() => {
    // Reset sort when data changes
    setSortConfig(null);
  }, [data]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [data, sortConfig]);

  const handleHeaderClick = (key: keyof T) => {
    const column = columns.find((c) => c.key === key);
    if (!column?.sortable) return;

    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: '#C9A84C' }}
          />
          <p style={{ color: '#704214', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>
            Loading data...
          </p>
        </div>
      </div>
    );
  }

  if (!sortedData.length) {
    return (
      <div
        className="py-12 text-center rounded"
        style={{
          backgroundColor: '#2C1810',
          border: '1px solid #3D2B1F',
        }}
      >
        <p style={{ color: '#704214', fontFamily: 'DM Sans, sans-serif' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded overflow-hidden border"
      style={{
        backgroundColor: '#2C1810',
        borderColor: '#3D2B1F',
        maxHeight,
        overflowY: 'auto',
      }}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ backgroundColor: '#3D2B1F', borderBottom: '1px solid #3D2B1F' }}>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                onClick={() => handleHeaderClick(column.key)}
                className="px-4 py-3 text-left font-semibold"
                style={{
                  color: '#C9A84C',
                  fontFamily: 'DM Sans, sans-serif',
                  cursor: column.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  width: column.width,
                  textAlign: column.align || 'left',
                  fontSize: '0.85rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                <div className="flex items-center gap-2">
                  {String(column.label)}
                  {column.sortable && sortConfig?.key === column.key && (
                    <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
            {actions && <th className="px-4 py-3" style={{ color: '#C9A84C' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className="border-b transition-colors hover:opacity-80"
              style={{
                backgroundColor:
                  striped && rowIndex % 2 === 1 ? 'rgba(61, 43, 31, 0.3)' : 'transparent',
                borderColor: '#3D2B1F',
                cursor: onRowClick ? 'pointer' : 'default',
              }}
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-4 py-3"
                  style={{
                    color: '#E8DCBE',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.9rem',
                    textAlign: column.align || 'left',
                  }}
                >
                  {column.render?.(row[column.key], row) ?? String(row[column.key] || '–')}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(row);
                        }}
                        className="px-2 py-1 text-xs font-medium rounded transition-all hover:opacity-80"
                        style={{
                          backgroundColor: '#3D2B1F',
                          color:
                            action.variant === 'danger' ? '#A0522D' :
                            action.variant === 'secondary' ? '#8B5E3C' :
                            '#C9A84C',
                          border: '1px solid #3D2B1F',
                          cursor: 'pointer',
                        }}
                      >
                        {action.icon} {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
