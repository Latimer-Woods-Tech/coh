/**
 * AdminSearchPanel - Global Search & Saved Searches
 */

import { useState } from 'react';
import { adminApi } from '@/lib/api';
import { SearchResult } from '@/types/admin';

export default function AdminSearchPanel() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    try {
      setIsLoading(true);
      const data = (await adminApi.search(query, searchType || undefined)) as any;
      setResults(data || []);
      setError(null);
      setHasSearched(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed';
      setError(msg);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return '👤';
      case 'order':
        return '📋';
      case 'booking':
        return '📅';
      case 'course':
        return '📚';
      case 'review':
        return '⭐';
      case 'log':
        return '📊';
      default:
        return '🔍';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Global Search
        </h2>
        <p style={{ color: '#704214', fontFamily: 'DM Sans, sans-serif' }}>
          Search across users, orders, bookings, courses, and more
        </p>
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="mb-6 p-6 rounded border"
        style={{
          backgroundColor: '#2C1810',
          borderColor: '#3D2B1F',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users, orders, courses..."
              className="w-full px-4 py-3 rounded"
              style={{
                backgroundColor: '#3D2B1F',
                color: '#E8DCBE',
                border: '1px solid #3D2B1F',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>

          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="w-full px-4 py-3 rounded"
            style={{
              backgroundColor: '#3D2B1F',
              color: '#E8DCBE',
              border: '1px solid #3D2B1F',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <option value="">All Types</option>
            <option value="user">Users</option>
            <option value="order">Orders</option>
            <option value="booking">Bookings</option>
            <option value="course">Courses</option>
            <option value="review">Reviews</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 px-6 py-3 rounded font-medium w-full md:w-auto"
          style={{
            backgroundColor: isLoading ? '#704214' : '#C9A84C',
            color: '#2C1810',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? '🔄 Searching...' : '🔍 Search'}
        </button>
      </form>

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

      {/* Results */}
      {hasSearched && (
        <div>
          {results.length > 0 ? (
            <div>
              <p
                className="mb-4 text-sm"
                style={{
                  color: '#704214',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>

              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 rounded border hover:opacity-80 transition-opacity cursor-pointer"
                    style={{
                      backgroundColor: '#2C1810',
                      borderColor: '#3D2B1F',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <span style={{ fontSize: '1.5rem' }}>
                        {getIcon(result.type)}
                      </span>
                      <div className="flex-1">
                        <h3
                          style={{
                            color: '#F5ECD7',
                            fontWeight: 600,
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          {result.title}
                        </h3>
                        {result.subtitle && (
                          <p
                            className="text-sm mt-1"
                            style={{
                              color: '#8B5E3C',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                          >
                            {result.subtitle}
                          </p>
                        )}
                        {result.description && (
                          <p
                            className="text-sm mt-2"
                            style={{
                              color: '#704214',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                          >
                            {result.description}
                          </p>
                        )}
                      </div>
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded"
                        style={{
                          backgroundColor: '#3D2B1F',
                          color: '#C9A84C',
                          fontFamily: 'DM Sans, sans-serif',
                          textTransform: 'capitalize',
                        }}
                      >
                        {result.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="py-12 text-center rounded"
              style={{
                backgroundColor: '#2C1810',
                borderColor: '#3D2B1F',
                border: '1px solid #3D2B1F',
                color: '#704214',
              }}
            >
              <p style={{ fontFamily: 'DM Sans, sans-serif' }}>
                No results found for "{query}"
              </p>
            </div>
          )}
        </div>
      )}

      {!hasSearched && (
        <div
          className="py-12 text-center rounded"
          style={{
            backgroundColor: '#2C1810',
            borderColor: '#3D2B1F',
            border: '1px solid #3D2B1F',
            color: '#704214',
          }}
        >
          <p style={{ fontFamily: 'DM Sans, sans-serif' }}>
            💡 Enter a search term to find users, orders, and more
          </p>
        </div>
      )}
    </div>
  );
}
