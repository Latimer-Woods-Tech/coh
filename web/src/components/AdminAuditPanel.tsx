/**
 * AdminAuditPanel - Audit Logs & Login History
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable, { Column } from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { AuditLog, LoginHistory, PaginationState } from '@/types/admin';

export default function AdminAuditPanel() {
  const [activeTab, setActiveTab] = useState<'logs' | 'logins'>('logs');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logins, setLogins] = useState<LoginHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async (page: number = 1) => {
    try {
      setIsLoading(true);

      if (activeTab === 'logs') {
        const response = (await adminApi.listAuditLogs(page, pagination.limit)) as any;
        setLogs(response.data || []);
        setPagination(response.pagination || { page, limit: pagination.limit, total: 0, totalPages: 0 });
      } else {
        const response = (await adminApi.listLoginHistory(page, pagination.limit)) as any;
        setLogins(response.data || []);
        setPagination(response.pagination || { page, limit: pagination.limit, total: 0, totalPages: 0 });
      }

      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const auditColumns: Column<AuditLog>[] = [
    {
      key: 'adminName',
      label: 'Admin',
    },
    {
      key: 'action',
      label: 'Action',
      render: (value) => (
        <span
          style={{
            backgroundColor: '#3D2B1F',
            color: '#C9A84C',
            padding: '0.25rem 0.75rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'resourceType',
      label: 'Resource',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span style={{ color: value === 'success' ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
          {value === 'success' ? '✓' : '✗'} {value}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Time',
      render: (value) => new Date(value as string).toLocaleString(),
    },
  ];

  const loginColumns: Column<LoginHistory>[] = [
    {
      key: 'userName',
      label: 'User',
      render: (value, row) => (
        <div>
          <p style={{ fontWeight: 600, color: '#F5ECD7' }}>{value}</p>
          <p className="text-xs" style={{ color: '#704214' }}>
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: 'success',
      label: 'Result',
      render: (value) => (
        <span style={{ color: value ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
          {value ? '✓ Success' : '✗ Failed'}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (value) => value || '—',
    },
    {
      key: 'loginAt',
      label: 'Login Time',
      render: (value) => new Date(value as string).toLocaleString(),
    },
    {
      key: 'logoutAt',
      label: 'Duration',
      render: (value, row) => {
        if (!value) return '—';
        const duration = new Date(value as string).getTime() - new Date(row.loginAt).getTime();
        return `${Math.round(duration / 60000)}m`;
      },
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Audit Logs & Security
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b" style={{ borderColor: '#3D2B1F' }}>
        {(['logs', 'logins'] as const).map((tab) => (
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
            {tab === 'logs' && '📋 Audit Logs'}
            {tab === 'logins' && '🔐 Login History'}
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

      {activeTab === 'logs' && (
        <>
          <DataTable<AuditLog>
            columns={auditColumns}
            data={logs}
            isLoading={isLoading}
            emptyMessage="No audit logs found"
          />
        </>
      )}

      {activeTab === 'logins' && (
        <>
          <DataTable<LoginHistory>
            columns={loginColumns}
            data={logins}
            isLoading={isLoading}
            emptyMessage="No login history found"
          />
        </>
      )}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={(page) => {
          setPagination((prev) => ({ ...prev, page }));
          loadData(page);
        }}
        onPageSizeChange={(size) => {
          setPagination((prev) => ({ ...prev, limit: size }));
          loadData(1);
        }}
      />
    </div>
  );
}
