/**
 * Pagination Component
 * Navigation for paginated data
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  totalItems,
}: PaginationProps) {
  const pageSizes = [10, 25, 50, 100];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pageNumbers: (number | string)[] = [];
  if (startPage > 1) {
    pageNumbers.push(1);
    if (startPage > 2) {
      pageNumbers.push('...');
    }
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    pageNumbers.push(totalPages);
  }

  if (totalPages <= 1) return null;

  return (
    <div
      className="px-6 py-4 border-t flex items-center justify-between flex-wrap gap-4"
      style={{
        backgroundColor: '#2C1810',
        borderColor: '#3D2B1F',
      }}
    >
      {/* Items info */}
      <div
        style={{
          color: '#704214',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.9rem',
        }}
      >
        {totalItems && (
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
          </span>
        )}
      </div>

      {/* Page size selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label
            style={{
              color: '#704214',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.9rem',
            }}
          >
            Per page:
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1); // Reset to first page
            }}
            className="px-2 py-1 rounded text-sm"
            style={{
              backgroundColor: '#3D2B1F',
              color: '#E8DCBE',
              border: '1px solid #3D2B1F',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Page number buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: currentPage === 1 ? '#3D2B1F' : '#3D2B1F',
            color: currentPage === 1 ? '#704214' : '#C9A84C',
            border: '1px solid #3D2B1F',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          ← Prev
        </button>

        {pageNumbers.map((page, idx) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                style={{
                  color: '#704214',
                  padding: '0.5rem 0.25rem',
                }}
              >
                …
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className="px-3 py-1 rounded text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: currentPage === page ? '#C9A84C' : '#3D2B1F',
                color: currentPage === page ? '#2C1810' : '#8B5E3C',
                border: `1px solid ${currentPage === page ? '#C9A84C' : '#3D2B1F'}`,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: currentPage === page ? 'bold' : 'normal',
              }}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: currentPage === totalPages ? '#3D2B1F' : '#3D2B1F',
            color: currentPage === totalPages ? '#704214' : '#C9A84C',
            border: '1px solid #3D2B1F',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
