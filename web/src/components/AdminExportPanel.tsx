/**
 * AdminExportPanel - Bulk Operations & Data Exports
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { ExportData, ScheduledReport } from '@/types/admin';

export default function AdminExportPanel() {
  const [activeTab, setActiveTab] = useState<'export' | 'scheduled'>('export');
  const [exports, setExports] = useState<ExportData[]>([]);
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportType, setExportType] = useState('users');
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    if (activeTab === 'export') {
      loadExports();
    } else {
      loadReports();
    }
  }, [activeTab]);

  const loadExports = async () => {
    try {
      setIsLoading(true);
      const data = (await adminApi.listExports()) as any;
      setExports(data || []);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load exports';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = (await adminApi.listScheduledReports()) as any;
      setReports(data || []);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load reports';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      await adminApi.exportData(exportType, exportFormat);
      await loadExports();
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExport = async (exportId: string) => {
    if (confirm('Delete this export?')) {
      try {
        await adminApi.deleteExport(exportId);
        await loadExports();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete export';
        setError(msg);
      }
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Delete this scheduled report?')) {
      try {
        await adminApi.deleteScheduledReport(reportId);
        await loadReports();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete report';
        setError(msg);
      }
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Bulk Operations & Exports
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b" style={{ borderColor: '#3D2B1F' }}>
        {(['export', 'scheduled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-6 py-3 font-medium text-sm uppercase tracking-wider transition-colors"
            style={{
              fontFamily: 'DM Sans, sans-serif',
              color: activeTab === tab ? '#C9A84C' : '#704214',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #C9A84C' : 'none',
              letterSpacing: '0.1em',
            }}
          >
            {tab === 'export' && '📥 Data Export'}
            {tab === 'scheduled' && '⏰ Scheduled Reports'}
          </button>
        ))}
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

      {activeTab === 'export' && (
        <>
          {/* Export Form */}
          <div
            className="p-6 rounded border mb-6"
            style={{
              backgroundColor: '#2C1810',
              borderColor: '#3D2B1F',
            }}
          >
            <h3
              className="text-lg font-bold mb-4"
              style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
            >
              Create New Export
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label
                  style={{
                    color: '#C9A84C',
                    fontFamily: 'DM Sans, sans-serif',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}
                >
                  Data Type
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full px-3 py-2 rounded"
                  style={{
                    backgroundColor: '#3D2B1F',
                    color: '#E8DCBE',
                    border: '1px solid #3D2B1F',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  <option value="users">Users</option>
                  <option value="orders">Orders</option>
                  <option value="bookings">Bookings</option>
                  <option value="products">Products</option>
                  <option value="courses">Courses</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    color: '#C9A84C',
                    fontFamily: 'DM Sans, sans-serif',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}
                >
                  Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded"
                  style={{
                    backgroundColor: '#3D2B1F',
                    color: '#E8DCBE',
                    border: '1px solid #3D2B1F',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleExportData}
                  disabled={isLoading}
                  className="w-full px-4 py-2 rounded font-medium"
                  style={{
                    backgroundColor: isLoading ? '#704214' : '#C9A84C',
                    color: '#2C1810',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? '⏳ Exporting...' : '📥 Export Now'}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Exports */}
          {exports.length > 0 && (
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
                Recent Exports
              </h3>

              <div className="space-y-3">
                {exports.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded flex items-center justify-between"
                    style={{
                      backgroundColor: '#3D2B1F',
                      borderColor: '#3D2B1F',
                    }}
                  >
                    <div>
                      <p style={{ color: '#F5ECD7', fontWeight: 600 }}>
                        {exp.name}
                      </p>
                      <p className="text-sm" style={{ color: '#704214' }}>
                        {exp.dataType} • {exp.type.toUpperCase()} • {new Date(exp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded"
                        style={{
                          backgroundColor:
                            exp.status === 'ready'
                              ? 'rgba(76, 175, 80, 0.2)'
                              : exp.status === 'processing'
                                ? 'rgba(255, 152, 0, 0.2)'
                                : 'rgba(244, 67, 54, 0.2)',
                          color:
                            exp.status === 'ready'
                              ? '#4CAF50'
                              : exp.status === 'processing'
                                ? '#FF9800'
                                : '#F44336',
                        }}
                      >
                        {exp.status}
                      </span>
                      {exp.status === 'ready' && (
                        <button
                          className="text-sm px-3 py-1 rounded"
                          style={{
                            backgroundColor: '#C9A84C',
                            color: '#2C1810',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          ⬇️ Download
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteExport(exp.id)}
                        className="text-sm px-3 py-1 rounded"
                        style={{
                          backgroundColor: 'rgba(160, 82, 45, 0.2)',
                          color: '#A0522D',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'scheduled' && (
        <div>
          {reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-6 rounded border"
                  style={{
                    backgroundColor: '#2C1810',
                    borderColor: '#3D2B1F',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        style={{
                          color: '#F5ECD7',
                          fontWeight: 600,
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {report.name}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: '#704214' }}>
                        {report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)} • {report.type.toUpperCase()} • Sent to {report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}
                      </p>
                      {report.nextRun && (
                        <p className="text-sm mt-1" style={{ color: '#8B5E3C' }}>
                          Next run: {new Date(report.nextRun).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          color: report.enabled ? '#4CAF50' : '#999',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                        }}
                      >
                        {report.enabled ? '🟢 Active' : '⚪ Inactive'}
                      </span>
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-sm px-3 py-1 rounded"
                        style={{
                          backgroundColor: 'rgba(160, 82, 45, 0.2)',
                          color: '#A0522D',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                No scheduled reports yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
