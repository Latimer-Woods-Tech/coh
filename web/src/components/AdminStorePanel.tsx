/**
 * AdminStorePanel - Product & Order Management
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable, { Column } from '@/components/DataTable';
import FilterPanel, { FilterField } from '@/components/FilterPanel';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { AdminProduct, AdminOrder, PaginationState } from '@/types/admin';

export default function AdminStorePanel() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  // Load products or orders based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async (page: number = 1) => {
    try {
      setIsLoading(true);
      let response;

      if (activeTab === 'products') {
        response = (await adminApi.listProducts(page, pagination.limit, filters)) as any;
        setProducts(response.data || []);
      } else {
        response = (await adminApi.listOrders(page, pagination.limit, filters)) as any;
        setOrders(response.data || []);
      }

      setPagination(response.pagination || { page, limit: pagination.limit, total: 0, totalPages: 0 });
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await adminApi.deleteProduct(productId);
        await loadData();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete product';
        setError(msg);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, status);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update order status';
      setError(msg);
    }
  };

  const productColumns: Column<AdminProduct>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'category',
      label: 'Category',
    },
    {
      key: 'price',
      label: 'Price',
      render: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: 'stock',
      label: 'Stock',
      width: '80px',
      align: 'center',
      render: (value) => (
        <span
          style={{
            color: Number(value) > 0 ? '#4CAF50' : '#F44336',
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
              value === 'active'
                ? 'rgba(76, 175, 80, 0.2)'
                : value === 'draft'
                  ? 'rgba(255, 152, 0, 0.2)'
                  : 'rgba(200, 200, 200, 0.2)',
            color:
              value === 'active'
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
  ];

  const orderColumns: Column<AdminOrder>[] = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
      render: (value) => `#${String(value).slice(-8)}`,
    },
    {
      key: 'userName',
      label: 'Customer',
      sortable: true,
    },
    {
      key: 'total',
      label: 'Total',
      render: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{
            backgroundColor:
              value === 'delivered'
                ? 'rgba(76, 175, 80, 0.2)'
                : value === 'shipped'
                  ? 'rgba(33, 150, 243, 0.2)'
                  : value === 'processing'
                    ? 'rgba(255, 152, 0, 0.2)'
                    : 'rgba(200, 200, 200, 0.2)',
            color:
              value === 'delivered'
                ? '#4CAF50'
                : value === 'shipped'
                  ? '#2196F3'
                  : value === 'processing'
                    ? '#FF9800'
                    : '#999',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (value) => (
        <span
          style={{
            color: value === 'paid' ? '#4CAF50' : value === 'unpaid' ? '#F44336' : '#999',
            fontWeight: 'bold',
            fontSize: '0.85rem',
          }}
        >
          {value}
        </span>
      ),
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
          Store Management
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b" style={{ borderColor: '#3D2B1F' }}>
        {(['products', 'orders'] as const).map((tab) => (
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
            {tab === 'products' && '📦 Products'}
            {tab === 'orders' && '📋 Orders'}
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

      {activeTab === 'products' && (
        <>
          <DataTable<AdminProduct>
            columns={productColumns}
            data={products}
            isLoading={isLoading}
            actions={[
              {
                label: 'Edit',
                icon: '✎',
                onClick: () => {},
                variant: 'secondary',
              },
              {
                label: 'Delete',
                icon: '🗑',
                onClick: (product) => handleDeleteProduct(product.id),
                variant: 'danger',
              },
            ]}
            emptyMessage="No products found"
          />
        </>
      )}

      {activeTab === 'orders' && (
        <>
          <DataTable<AdminOrder>
            columns={orderColumns}
            data={orders}
            isLoading={isLoading}
            emptyMessage="No orders found"
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
