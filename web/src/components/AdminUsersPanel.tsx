/**
 * AdminUsersPanel - User Management
 * Manage users, roles, status, and bulk actions
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import DataTable, { Column } from '@/components/DataTable';
import FilterPanel, { FilterField } from '@/components/FilterPanel';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { AdminUser, UserFilter, PaginationState } from '@/types/admin';

const ROLE_OPTIONS = [
  { label: 'User', value: 'user' },
  { label: 'Instructor', value: 'instructor' },
  { label: 'Admin', value: 'admin' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Pending', value: 'pending' },
];

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<UserFilter>({});
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Load users
  const loadUsers = async (page: number = 1, currentFilters?: UserFilter) => {
    try {
      setIsLoading(true);
      const response = (await adminApi.listUsers(
        page,
        pagination.limit,
        currentFilters || filters
      )) as any;
      setUsers(response.data || []);
      setPagination(response.pagination || { page, limit: pagination.limit, total: 0, totalPages: 0 });
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load users';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleFilter = (newFilters: Record<string, unknown>) => {
    const typedFilters: UserFilter = {
      role: newFilters.role as string,
      status: newFilters.status as string,
      searchTerm: newFilters.searchTerm as string,
    };
    setFilters(typedFilters);
    loadUsers(1, typedFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    loadUsers(1, {});
  };

  const handlePageChange = (page: number) => {
    loadUsers(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, limit: size }));
    loadUsers(1);
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      await adminApi.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        status: editingUser.status,
      });
      setIsEditModalOpen(false);
      setEditingUser(null);
      setError(null);
      await loadUsers(pagination.page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      setError(msg);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await adminApi.suspendUser(userId);
      await loadUsers(pagination.page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to suspend user';
      setError(msg);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
      try {
        await adminApi.deleteUser(userId);
        await loadUsers(pagination.page);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete user';
        setError(msg);
      }
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
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
      key: 'role',
      label: 'Role',
      width: '100px',
      render: (value) => (
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{
            backgroundColor:
              value === 'admin'
                ? '#C9A84C'
                : value === 'instructor'
                  ? '#3D2B1F'
                  : '#2C1810',
            color: value === 'admin' ? '#2C1810' : '#C9A84C',
            border: '1px solid #3D2B1F',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (value) => (
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{
            backgroundColor:
              value === 'active'
                ? 'rgba(76, 175, 80, 0.2)'
                : value === 'pending'
                  ? 'rgba(255, 152, 0, 0.2)'
                  : 'rgba(244, 67, 54, 0.2)',
            color:
              value === 'active'
                ? '#4CAF50'
                : value === 'pending'
                  ? '#FF9800'
                  : '#F44336',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'enrollments',
      label: 'Enrollments',
      width: '100px',
      align: 'center',
    },
    {
      key: 'joinedAt',
      label: 'Joined',
      width: '120px',
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ];

  const filterFields: FilterField[] = [
    {
      id: 'role',
      label: 'Role',
      type: 'select',
      options: ROLE_OPTIONS,
    },
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
      placeholder: 'Name or email...',
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
          User Management
        </h2>
        <div className="text-sm" style={{ color: '#704214' }}>
          Total Users: <span style={{ color: '#C9A84C', fontWeight: 700 }}>{pagination.total}</span>
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

      {/* Filters */}
      <FilterPanel
        fields={filterFields}
        onFilter={handleFilter}
        onClear={handleClearFilters}
        isCollapsible={true}
      />

      {/* Data Table */}
      <DataTable<AdminUser>
        columns={columns}
        data={users}
        isLoading={isLoading}
        actions={[
          {
            label: 'Edit',
            icon: '✎',
            onClick: handleEditUser,
            variant: 'secondary',
          },
          {
            label: 'Suspend',
            icon: '⊘',
            onClick: (user) => handleSuspendUser(user.id),
            variant: 'secondary',
          },
          {
            label: 'Delete',
            icon: '🗑',
            onClick: (user) => handleDeleteUser(user.id),
            variant: 'danger',
          },
        ]}
        emptyMessage="No users found"
        maxHeight="600px"
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        title="Edit User"
        description={`Update user information`}
        size="md"
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setIsEditModalOpen(false);
              setEditingUser(null);
            },
            variant: 'secondary',
          },
          {
            label: 'Save Changes',
            onClick: handleSaveUser,
            variant: 'primary',
          },
        ]}
      >
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: '#C9A84C',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded"
                style={{
                  backgroundColor: '#3D2B1F',
                  color: '#E8DCBE',
                  border: '1px solid #3D2B1F',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: '#C9A84C',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
                className="w-full px-3 py-2 rounded"
                style={{
                  backgroundColor: '#3D2B1F',
                  color: '#E8DCBE',
                  border: '1px solid #3D2B1F',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: '#C9A84C',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Role
              </label>
              <select
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    role: e.target.value as 'user' | 'instructor' | 'admin',
                  })
                }
                className="w-full px-3 py-2 rounded"
                style={{
                  backgroundColor: '#3D2B1F',
                  color: '#E8DCBE',
                  border: '1px solid #3D2B1F',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{
                  color: '#C9A84C',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Status
              </label>
              <select
                value={editingUser.status}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    status: e.target.value as 'active' | 'suspended' | 'pending',
                  })
                }
                className="w-full px-3 py-2 rounded"
                style={{
                  backgroundColor: '#3D2B1F',
                  color: '#E8DCBE',
                  border: '1px solid #3D2B1F',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
