import { useEffect, useRef, useState } from 'react';
import api from '@/api/client';
import { useT } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface WaStatus {
  enabled: boolean;
  status: 'DISABLED' | 'DISCONNECTED' | 'CONNECTING' | 'QR_PENDING' | 'CONNECTED';
  phone: string | null;
  qrDataUrl: string | null;
  sendBookingConfirmation: boolean;
  sendDayBeforeReminder: boolean;
  lastError: string | null;
}

export function WhatsAppPanel() {
  const t = useT();
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setStatus(res.data?.data ?? res.data);
    } catch {
      /* leave previous state */
    }
  };

  useEffect(() => {
    load();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll while pairing is in progress so the QR shows up and flips to connected automatically
  useEffect(() => {
    const shouldPoll = status?.status === 'CONNECTING' || status?.status === 'QR_PENDING';
    if (shouldPoll && !pollRef.current) {
      pollRef.current = setInterval(load, 3000);
    } else if (!shouldPoll && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [status?.status]);

  const connect = async () => {
    setBusy(true);
    try {
      await api.post('/whatsapp/connect');
      setStatus((s) => s ? { ...s, status: 'CONNECTING' } : s);
      setTimeout(load, 2000);
    } finally { setBusy(false); }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await api.post('/whatsapp/disconnect');
      await load();
    } finally { setBusy(false); }
  };

  const toggle = async (key: 'sendBookingConfirmation' | 'sendDayBeforeReminder', value: boolean) => {
    await api.put('/whatsapp/settings', { [key]: value });
    await load();
  };

  const sendTest = async () => {
    setBusy(true);
    setTestResult(null);
    try {
      await api.post('/whatsapp/test', { phone: testPhone });
      setTestResult(t('wa.testOk'));
    } catch (e: any) {
      setTestResult(e?.response?.data?.message || t('wa.testFail'));
    } finally { setBusy(false); }
  };

  if (!status) return <Card className="p-6 text-sm text-gray-400">…</Card>;

  if (!status.enabled) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">{t('wa.disabled')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t('wa.title')}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{t('wa.subtitle')}</p>
          </div>
          <Badge variant={status.status === 'CONNECTED' ? 'green' : status.status === 'DISCONNECTED' ? 'gray' : 'blue'}>
            {status.status === 'CONNECTED' && status.phone
              ? `${t('wa.connected')} · +${status.phone}`
              : t(`wa.status.${status.status}`)}
          </Badge>
        </div>

        {status.status === 'DISCONNECTED' && (
          <Button onClick={connect} disabled={busy}>{t('wa.connect')}</Button>
        )}

        {(status.status === 'CONNECTING') && (
          <p className="text-xs text-gray-500">{t('wa.preparing')}</p>
        )}

        {status.status === 'QR_PENDING' && status.qrDataUrl && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700">{t('wa.scanTitle')}</p>
            <ol className="text-xs text-gray-500 list-decimal ms-4 space-y-0.5">
              <li>{t('wa.scanStep1')}</li>
              <li>{t('wa.scanStep2')}</li>
              <li>{t('wa.scanStep3')}</li>
            </ol>
            <img src={status.qrDataUrl} alt="WhatsApp QR" className="w-64 h-64 rounded-xl border border-gray-200" />
          </div>
        )}

        {status.status === 'CONNECTED' && (
          <Button variant="secondary" onClick={disconnect} disabled={busy}>{t('wa.disconnect')}</Button>
        )}

        {status.lastError ? (
          <p className="text-[11px] text-red-500">{t('wa.lastError')}: {status.lastError}</p>
        ) : null}
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-900">{t('wa.messagesTitle')}</h3>
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={status.sendBookingConfirmation}
            onChange={(e) => toggle('sendBookingConfirmation', e.target.checked)}
          />
          {t('wa.toggleConfirmation')}
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={status.sendDayBeforeReminder}
            onChange={(e) => toggle('sendDayBeforeReminder', e.target.checked)}
          />
          {t('wa.toggleReminder')}
        </label>
      </Card>

      {status.status === 'CONNECTED' && (
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900">{t('wa.testTitle')}</h3>
          <div className="flex items-center gap-2">
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="max-w-xs"
            />
            <Button onClick={sendTest} disabled={busy || !testPhone.trim()}>{t('wa.testSend')}</Button>
          </div>
          {testResult && <p className="text-xs text-gray-600">{testResult}</p>}
        </Card>
      )}
    </div>
  );
}
