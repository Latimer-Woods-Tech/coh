/**
 * FilterPanel Component
 * Unified filtering interface for all admin panels
 */

import { useState } from 'react';

export interface FilterOption {
  label: string;
  value: string;
  icon?: string;
}

export interface FilterField {
  id: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'daterange' | 'number';
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterPanelProps {
  fields: FilterField[];
  onFilter: (filters: Record<string, unknown>) => void;
  onClear: () => void;
  isCollapsible?: boolean;
}

export default function FilterPanel({
  fields,
  onFilter,
  onClear,
  isCollapsible = true,
}: FilterPanelProps) {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [isExpanded, setIsExpanded] = useState(!isCollapsible);

  const handleFilterChange = (fieldId: string, value: unknown) => {
    const newFilters = { ...filters, [fieldId]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const activeFilterCount = Object.values(filters).filter((v) => v).length;

  return (
    <div
      className="rounded border mb-6"
      style={{
        backgroundColor: '#2C1810',
        borderColor: '#3D2B1F',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: '#3D2B1F',
          borderBottom: isExpanded ? '1px solid #3D2B1F' : 'none',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-semibold uppercase tracking-wider"
            style={{
              color: '#C9A84C',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            🔍 Filters
          </span>
          {activeFilterCount > 0 && (
            <span
              className="px-2 py-1 rounded text-xs font-bold"
              style={{
                backgroundColor: '#C9A84C',
                color: '#2C1810',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        {isCollapsible && (
          <span
            style={{
              color: '#704214',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            ▼
          </span>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{
                    color: '#C9A84C',
                    fontFamily: 'DM Sans, sans-serif',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                  htmlFor={field.id}
                >
                  {field.label}
                </label>

                {field.type === 'select' && field.options && (
                  <select
                    id={field.id}
                    value={filters[field.id] || ''}
                    onChange={(e) => handleFilterChange(field.id, e.target.value || null)}
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{
                      backgroundColor: '#3D2B1F',
                      color: '#E8DCBE',
                      border: '1px solid #3D2B1F',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    <option value="">-- All --</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'text' && (
                  <input
                    id={field.id}
                    type="text"
                    placeholder={field.placeholder}
                    value={filters[field.id] || ''}
                    onChange={(e) =>
                      handleFilterChange(field.id, e.target.value || null)
                    }
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{
                      backgroundColor: '#3D2B1F',
                      color: '#E8DCBE',
                      border: '1px solid #3D2B1F',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                )}

                {field.type === 'date' && (
                  <input
                    id={field.id}
                    type="date"
                    value={filters[field.id] || ''}
                    onChange={(e) =>
                      handleFilterChange(field.id, e.target.value || null)
                    }
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{
                      backgroundColor: '#3D2B1F',
                      color: '#E8DCBE',
                      border: '1px solid #3D2B1F',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                )}

                {field.type === 'number' && (
                  <input
                    id={field.id}
                    type="number"
                    placeholder={field.placeholder}
                    value={filters[field.id] || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        field.id,
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{
                      backgroundColor: '#3D2B1F',
                      color: '#E8DCBE',
                      border: '1px solid #3D2B1F',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: '#3D2B1F' }}>
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded text-sm font-medium"
                style={{
                  backgroundColor: '#3D2B1F',
                  color: '#A0522D',
                  border: '1px solid #3D2B1F',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
