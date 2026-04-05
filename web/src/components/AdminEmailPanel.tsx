/**
 * AdminEmailPanel - Email Campaign & Template Management
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable, { Column } from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import { EmailCampaign, PaginationState } from '@/types/admin';

export default function AdminEmailPanel() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadCampaigns = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = (await adminApi.listCampaigns(page, pagination.limit)) as any;
      setCampaigns(response.data || []);
      setPagination(response.pagination || { page, limit: pagination.limit, total: 0, totalPages: 0 });
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load campaigns';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleSendCampaign = async (campaignId: string) => {
    if (confirm('Send this campaign now?')) {
      try {
        await adminApi.sendCampaign(campaignId);
        await loadCampaigns(pagination.page);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send campaign';
        setError(msg);
      }
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      try {
        await adminApi.deleteCampaign(campaignId);
        await loadCampaigns(pagination.page);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete campaign';
        setError(msg);
      }
    }
  };

  const columns: Column<EmailCampaign>[] = [
    {
      key: 'name',
      label: 'Campaign Name',
      sortable: true,
    },
    {
      key: 'subject',
      label: 'Subject',
    },
    {
      key: 'recipientCount',
      label: 'Recipients',
      width: '100px',
      align: 'center',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{
            backgroundColor:
              value === 'sent'
                ? 'rgba(76, 175, 80, 0.2)'
                : value === 'sending'
                  ? 'rgba(33, 150, 243, 0.2)'
                  : value === 'scheduled'
                    ? 'rgba(255, 152, 0, 0.2)'
                    : 'rgba(200, 200, 200, 0.2)',
            color:
              value === 'sent'
                ? '#4CAF50'
                : value === 'sending'
                  ? '#2196F3'
                  : value === 'scheduled'
                    ? '#FF9800'
                    : '#999',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'openRate',
      label: 'Open Rate',
      render: (value) => (value ? `${Number(value).toFixed(1)}%` : '—'),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Email Campaigns
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
          + New Campaign
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

      <DataTable<EmailCampaign>
        columns={columns}
        data={campaigns}
        isLoading={isLoading}
        actions={[
          {
            label: 'Edit',
            icon: '✎',
            onClick: () => {},
            variant: 'secondary',
          },
          {
            label: 'Send',
            icon: '✉',
            onClick: (campaign) =>
              campaign.status === 'draft' && handleSendCampaign(campaign.id),
            variant: 'secondary',
          },
          {
            label: 'Delete',
            icon: '🗑',
            onClick: (campaign) => handleDeleteCampaign(campaign.id),
            variant: 'danger',
          },
        ]}
        emptyMessage="No campaigns found"
      />

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={(page) => loadCampaigns(page)}
        onPageSizeChange={(size) => {
          setPagination((prev) => ({ ...prev, limit: size }));
          loadCampaigns(1);
        }}
      />
    </div>
  );
}
