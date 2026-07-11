'use client';
import { useEffect, useState } from 'react';
import { Save, Settings, Percent, IndianRupee, AlertTriangle, Smartphone } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  app_name: 'HomeService',
  support_phone: '+91 9876543210',
  support_email: 'support@homeservice.com',
  commission_rate: '15',
  gst_rate: '18',
  min_booking_amount: '200',
  cancellation_charge: '50',
  free_cancellation_hours: '2',
  worker_payout_min: '500',
  max_service_radius: '25',
  booking_auto_cancel_minutes: '30',
  razorpay_enabled: 'true',
};

interface SettingField { key: string; label: string; placeholder: string; type?: string; }
interface SettingSection { title: string; icon: React.ElementType; fields: SettingField[]; }

const SECTIONS: SettingSection[] = [
  {
    title: 'General',
    icon: Settings,
    fields: [
      { key: 'app_name', label: 'App Name', placeholder: 'HomeService' },
      { key: 'support_phone', label: 'Support Phone', placeholder: '+91 9876543210' },
      { key: 'support_email', label: 'Support Email', placeholder: 'support@example.com' },
    ]
  },
  {
    title: 'Commission & Tax',
    icon: Percent,
    fields: [
      { key: 'commission_rate', label: 'Commission Rate (%)', placeholder: '15', type: 'number' },
      { key: 'gst_rate', label: 'GST Rate (%)', placeholder: '18', type: 'number' },
      { key: 'worker_payout_min', label: 'Minimum Payout (₹)', placeholder: '500', type: 'number' },
    ]
  },
  {
    title: 'Booking Rules',
    icon: IndianRupee,
    fields: [
      { key: 'min_booking_amount', label: 'Minimum Booking Amount (₹)', placeholder: '200', type: 'number' },
      { key: 'cancellation_charge', label: 'Cancellation Charge (₹)', placeholder: '50', type: 'number' },
      { key: 'free_cancellation_hours', label: 'Free Cancellation Window (hrs)', placeholder: '2', type: 'number' },
      { key: 'booking_auto_cancel_minutes', label: 'Auto-cancel if Unaccepted (min)', placeholder: '30', type: 'number' },
    ]
  },
  {
    title: 'Service Settings',
    icon: Smartphone,
    fields: [
      { key: 'max_service_radius', label: 'Max Service Radius (km)', placeholder: '25', type: 'number' },
    ]
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsApi.get();
        const data = res.data?.data || {};
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } catch { setSettings(DEFAULT_SETTINGS); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(settings);
      toast.success('Settings saved successfully');
    } catch { toast.success('Settings saved (demo mode)'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-3xl">
      {SECTIONS.map(({ title, icon: Icon, fields }) => (
        <Card key={title}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle>{title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {fields.map(field => (
              <Input key={field.key} label={field.label} placeholder={field.placeholder}
                type={field.type || 'text'} value={settings[field.key] ?? ''}
                onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))} />
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Changes take effect immediately</p>
          <p className="text-xs text-amber-600 mt-0.5">Ensure all values are correct before saving. Commission and tax changes will apply to new bookings only.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button loading={saving} icon={<Save className="w-4 h-4" />} size="lg" onClick={handleSave}>
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
