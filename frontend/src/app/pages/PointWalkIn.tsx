import { useState } from 'react';
import { CheckCircle, Package, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { calculateShipmentPrice, createWalkInShipment, formatPaymentStatus, formatShipmentStatus, type WalkInShipmentResponse } from '../api';
import { DashboardShell } from '../components/DashboardShell';
import { useAppStateContext } from '../state/AppStateContext';

const CITIES = [
  'Warszawa', 'Łódź', 'Kraków', 'Wrocław', 'Poznań',
  'Gdańsk', 'Szczecin', 'Lublin', 'Katowice', 'Bydgoszcz',
];

interface FormState {
  customerMode: 'EXISTING' | 'NEW';
  customerEmail: string;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderStreet: string;
  recipientName: string;
  recipientPhone: string;
  recipientCity: string;
  recipientStreet: string;
  weight: string;
  sizeCategory: string;
  declaredValue: string;
  fragile: boolean;
}

const emptyForm: FormState = {
  customerMode: 'NEW',
  customerEmail: '',
  senderName: '',
  senderPhone: '',
  senderCity: 'Warszawa',
  senderStreet: '',
  recipientName: '',
  recipientPhone: '',
  recipientCity: 'Warszawa',
  recipientStreet: '',
  weight: '1',
  sizeCategory: 'SMALL',
  declaredValue: '0',
  fragile: false,
};

function printWalkInLabel(result: WalkInShipmentResponse, form: FormState) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Etykieta walk-in ${result.trackingNumber}</title>
  <style>
    @page { size: 105mm 148mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 105mm; height: 148mm; font-family: Arial, sans-serif; font-size: 10pt; padding: 6mm; }
    .header { display: flex; align-items: center; gap: 4mm; border-bottom: 1px solid #000; padding-bottom: 3mm; margin-bottom: 3mm; }
    .logo { font-size: 14pt; font-weight: bold; }
    .badge { background: #000; color: #fff; padding: 1mm 3mm; font-size: 8pt; border-radius: 2mm; }
    .tracking { text-align: center; margin: 4mm 0; }
    .tracking-num { font-size: 16pt; font-weight: bold; letter-spacing: 2px; }
    .section { margin-bottom: 3mm; }
    .section-label { font-size: 7pt; text-transform: uppercase; color: #555; margin-bottom: 1mm; }
    .section-value { font-size: 10pt; }
    .divider { border-top: 1px dashed #999; margin: 3mm 0; }
    .meta { display: flex; gap: 4mm; font-size: 8pt; color: #555; }
    .fragile { color: red; font-weight: bold; font-size: 9pt; margin-top: 2mm; }
    .footer { border-top: 1px solid #000; padding-top: 2mm; margin-top: auto; font-size: 7pt; color: #888; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🐧 PingwinPost</div>
    <div class="badge">WALK-IN</div>
  </div>
  <div class="tracking">
    <div style="font-size:7pt;color:#555;margin-bottom:1mm;">NUMER PRZESYŁKI</div>
    <div class="tracking-num">${result.trackingNumber}</div>
  </div>
  <div class="divider"></div>
  <div class="section">
    <div class="section-label">Nadawca</div>
    <div class="section-value">${form.senderName}</div>
    <div style="font-size:9pt;color:#333;">${form.senderPhone}</div>
    <div style="font-size:9pt;color:#333;">${form.senderCity}, ${form.senderStreet}</div>
  </div>
  <div class="divider"></div>
  <div class="section">
    <div class="section-label">Odbiorca</div>
    <div class="section-value">${form.recipientName}</div>
    <div style="font-size:9pt;color:#333;">${form.recipientPhone}</div>
    <div style="font-size:9pt;color:#333;">${form.recipientCity}, ${form.recipientStreet}</div>
  </div>
  <div class="divider"></div>
  <div class="meta">
    <span>Waga: ${form.weight} kg</span>
    <span>Rozmiar: ${form.sizeCategory}</span>
    <span>Opłata: ${result.amount.toFixed(2)} PLN</span>
  </div>
  ${form.fragile ? '<div class="fragile">⚠ OSTROŻNIE — KRUCHE</div>' : ''}
  <div style="font-size:7pt;color:#555;margin-top:2mm;">Punkt: ${result.pointName} (${result.pointCode})</div>
  <div class="footer">${new Date().toLocaleString('pl-PL')}</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

export default function PointWalkIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    state: { currentUser },
  } = useAppStateContext();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WalkInShipmentResponse | null>(null);
  const [lastForm, setLastForm] = useState<FormState>(emptyForm);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser?.email) return;

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const resp = await createWalkInShipment(currentUser.email, {
        customerMode: form.customerMode,
        customerEmail: form.customerEmail.trim(),
        senderName: form.senderName.trim(),
        senderPhone: form.senderPhone.trim(),
        senderAddress: `${form.senderCity}, ${form.senderStreet.trim()}`,
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        recipientAddress: `${form.recipientCity}, ${form.recipientStreet.trim()}`,
        weight: parseFloat(form.weight) || 1,
        sizeCategory: form.sizeCategory,
        declaredValue: parseFloat(form.declaredValue) || 0,
        fragile: form.fragile,
      });
      setLastForm(form);
      setResult(resp);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('walkIn.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardShell role="point" title={t('walkIn.title')}>
      {error ? <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div> : null}

      {result ? (
        <div className="mb-8 rounded-xl border border-success/40 bg-success/10 p-6">
          <div className="mb-4 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <div className="font-semibold text-success">{t('walkIn.successTitle')}</div>
              <div className="text-sm text-muted-foreground">{t('walkIn.successPayment')}</div>
            </div>
          </div>
            <div className="mb-4 space-y-1 text-sm">
              <div><span className="text-muted-foreground">{t('walkIn.trackingLabel')}</span> <strong className="font-mono text-base">{result.trackingNumber}</strong></div>
              <div><span className="text-muted-foreground">{t('walkIn.shipmentStatusLabel')}</span> {formatShipmentStatus(result.shipmentStatus)}</div>
              <div><span className="text-muted-foreground">{t('walkIn.customerLabel')}</span> {result.customerEmail}</div>
              <div><span className="text-muted-foreground">{t('walkIn.paymentLabel')}</span> {formatPaymentStatus(result.paymentStatus)}</div>
              <div><span className="text-muted-foreground">{t('walkIn.amountLabel')}</span> <strong>{result.amount.toFixed(2)} PLN</strong></div>
            </div>
            <div className="flex gap-3">
            <button
              type="button"
              onClick={() => printWalkInLabel(result, lastForm)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-white transition-colors hover:bg-accent/90"
            >
              <Printer className="h-4 w-4" />
              {t('walkIn.printLabel')}
            </button>
              <button
                type="button"
                onClick={() => navigate(`/point/accept?q=${encodeURIComponent(result.trackingNumber)}`)}
                className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
              >
                Przejdz do nadania dalej
              </button>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="rounded-lg border border-border bg-card px-4 py-2 transition-colors hover:bg-muted"
              >
              {t('walkIn.newShipment')}
            </button>
          </div>
        </div>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">{t('walkIn.sectionCustomer')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.customerMode')}</label>
              <select
                required
                name="customerMode"
                value={form.customerMode}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="NEW">{t('walkIn.newCustomer')}</option>
                <option value="EXISTING">{t('walkIn.existingCustomer')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.customerEmail')}</label>
              <input
                required
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={handleChange}
                placeholder="jan.kowalski.client@example.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Package className="h-5 w-5 text-muted-foreground" />
            {t('walkIn.sectionSender')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.name')}</label>
              <input
                required
                name="senderName"
                value={form.senderName}
                onChange={handleChange}
                placeholder="Jan Kowalski"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.phone')}</label>
              <input
                required
                name="senderPhone"
                value={form.senderPhone}
                onChange={handleChange}
                placeholder="+48 500 000 000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.city')}</label>
              <select
                required
                name="senderCity"
                value={form.senderCity}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.street')}</label>
              <input
                required
                name="senderStreet"
                value={form.senderStreet}
                onChange={handleChange}
                placeholder="np. Narutowicza 14"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Package className="h-5 w-5 text-muted-foreground" />
            {t('walkIn.sectionRecipient')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.name')}</label>
              <input
                required
                name="recipientName"
                value={form.recipientName}
                onChange={handleChange}
                placeholder="Anna Nowak"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.phone')}</label>
              <input
                required
                name="recipientPhone"
                value={form.recipientPhone}
                onChange={handleChange}
                placeholder="+48 600 000 000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.city')}</label>
              <select
                required
                name="recipientCity"
                value={form.recipientCity}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.street')}</label>
              <input
                required
                name="recipientStreet"
                value={form.recipientStreet}
                onChange={handleChange}
                placeholder="np. Marszalkowska 5"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">{t('walkIn.sectionParcel')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.weight')}</label>
              <input
                required
                type="number"
                min="0.1"
                step="0.1"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.size')}</label>
              <select
                name="sizeCategory"
                value={form.sizeCategory}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="SMALL">{t('walkIn.sizeSmall')}</option>
                <option value="MEDIUM">{t('walkIn.sizeMedium')}</option>
                <option value="LARGE">{t('walkIn.sizeLarge')}</option>
                <option value="XLARGE">{t('walkIn.sizeXLarge')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t('walkIn.declaredValue')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="declaredValue"
                value={form.declaredValue}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="fragile"
              name="fragile"
              checked={form.fragile}
              onChange={handleChange}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <label htmlFor="fragile" className="text-sm">{t('walkIn.fragile')}</label>
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">{t('walkIn.estimatedFee')} </span>
            <strong>
              {calculateShipmentPrice(parseFloat(form.declaredValue) || 0, form.fragile).toFixed(2)} PLN
            </strong>
            <span className="text-muted-foreground"> {t('walkIn.cashNote')}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent/90 disabled:opacity-70"
          >
            {isSubmitting ? t('walkIn.submitting') : t('walkIn.submit')}
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}
