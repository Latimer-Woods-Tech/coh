/**
 * AdminSettingsPanel - Global Settings & Configuration
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import Modal from '@/components/Modal';
import { AdminSettings } from '@/types/admin';

export default function AdminSettingsPanel() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState<AdminSettings | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = (await adminApi.getSettings()) as any;
      setSettings(data);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load settings';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!editingSettings) return;

    try {
      await adminApi.updateSettings(editingSettings);
      setIsEditModalOpen(false);
      setEditingSettings(null);
      await loadSettings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings';
      setError(msg);
    }
  };

  const defaultSettings: AdminSettings = {
    general: {
      siteName: 'CypherOfHealing',
      siteDescription: 'Holistic wellness and healing platform',
      supportEmail: 'support@cypherofhealing.com',
      maintenanceMode: false,
    },
    pricing: {
      defaultCurrency: 'USD',
      taxRate: 0.1,
      freeShippingThreshold: 100,
    },
    email: {
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      fromEmail: 'noreply@cypherofhealing.com',
      replyTo: 'support@cypherofhealing.com',
      enabled: true,
    },
    features: {
      bookingsEnabled: true,
      storeEnabled: true,
      eventsEnabled: true,
      academyEnabled: true,
    },
  };

  const currentSettings = settings || defaultSettings;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#C9A84C' }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: '"Playfair Display", serif', color: '#F5ECD7' }}
        >
          Settings & Configuration
        </h2>
        <button
          onClick={() => {
            setEditingSettings({ ...currentSettings });
            setIsEditModalOpen(true);
          }}
          className="px-4 py-2 rounded font-medium text-sm"
          style={{
            fontFamily: 'DM Sans, sans-serif',
            backgroundColor: '#C9A84C',
            color: '#2C1810',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Edit Settings
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

      {/* Settings Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
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
            General Settings
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm" style={{ color: '#704214' }}>
                Site Name
              </p>
              <p style={{ color: '#E8DCBE', fontWeight: 600 }}>
                {currentSettings.general.siteName}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: '#704214' }}>
                Support Email
              </p>
              <p style={{ color: '#E8DCBE', fontWeight: 600 }}>
                {currentSettings.general.supportEmail}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: '#704214' }}>
                Maintenance Mode
              </p>
              <p style={{ color: currentSettings.general.maintenanceMode ? '#F44336' : '#4CAF50' }}>
                {currentSettings.general.maintenanceMode ? '🔴 ACTIVE' : '🟢 OFF'}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
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
            Enabled Features
          </h3>
          <div className="space-y-2">
            {Object.entries(currentSettings.features).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <span
                  style={{ color: '#E8DCBE', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize' }}
                >
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span style={{ color: enabled ? '#4CAF50' : '#999' }}>
                  {enabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
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
            Pricing Configuration
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm" style={{ color: '#704214' }}>
                Currency
              </p>
              <p style={{ color: '#E8DCBE', fontWeight: 600 }}>
                {currentSettings.pricing.defaultCurrency}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: '#704214' }}>
                Tax Rate
              </p>
              <p style={{ color: '#E8DCBE', fontWeight: 600 }}>
                {(currentSettings.pricing.taxRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: '#704214' }}>
                Free Shipping Threshold
              </p>
              <p style={{ color: '#E8DCBE', fontWeight: 600 }}>
                ${currentSettings.pricing.freeShippingThreshold}
              </p>
            </div>
          </div>
        </div>

        {/* Email */}
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
            Email Configuration
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm" style={{ color: '#704214' }}>
                Status
              </p>
              <p style={{ color: currentSettings.email.enabled ? '#4CAF50' : '#F44336' }}>
                {currentSettings.email.enabled ? '🟢 Enabled' : '🔴 Disabled'}
              </p>
            </div>
            <div>
              <p className="text-sm" style={{ color: '#704214' }}>
                From Email
              </p>
              <p style={{ color: '#E8DCBE', fontWeight: 600, fontSize: '0.85rem' }}>
                {currentSettings.email.fromEmail}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSettings(null);
        }}
        title="Edit Settings"
        size="lg"
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setIsEditModalOpen(false);
              setEditingSettings(null);
            },
            variant: 'secondary',
          },
          {
            label: 'Save Changes',
            onClick: handleSaveSettings,
            variant: 'primary',
          },
        ]}
      >
        {editingSettings && (
          <div className="space-y-6">
            <div>
              <h4 className="font-bold mb-3" style={{ color: '#C9A84C' }}>
                General
              </h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={editingSettings.general.siteName}
                  onChange={(e) =>
                    setEditingSettings({
                      ...editingSettings,
                      general: { ...editingSettings.general, siteName: e.target.value },
                    })
                  }
                  placeholder="Site Name"
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: '#3D2B1F',
                    color: '#E8DCBE',
                    border: '1px solid #3D2B1F',
                  }}
                />
                <input
                  type="email"
                  value={editingSettings.general.supportEmail}
                  onChange={(e) =>
                    setEditingSettings({
                      ...editingSettings,
                      general: { ...editingSettings.general, supportEmail: e.target.value },
                    })
                  }
                  placeholder="Support Email"
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: '#3D2B1F',
                    color: '#E8DCBE',
                    border: '1px solid #3D2B1F',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
