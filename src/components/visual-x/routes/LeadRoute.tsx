import { useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { api } from '@/lib/api';
import { VisualXField, VisualXSelect, VisualXButton, VisualXEmptyState, VisualXProvenanceBadge, VisualXBlockedState } from '../VisualXPrimitives';
import { PullToRefresh } from '../PullToRefresh';
import { Camera, Save, User, MapPin } from 'lucide-react';

export function LeadRoute() {
  const { state, notify, refresh } = useApp();
  const [form, setForm] = useState({ customerName: '', propertyType: 'garage', address: '', appointment: '', floorCondition: 'fair', desiredFinish: '', squareFeet: 0, notes: '' });
  const [photo, setPhoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const leads = state?.leads || [];

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    if (!form.address.trim()) e.address = 'Project address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhoto = async (file: File) => {
    setUploading(true);
    try { setPhoto(await api.uploadFile(file)); notify('Photo uploaded.'); }
    catch { notify('Photo upload failed.'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!validate()) { notify('Please fix the required fields.'); return; }
    setSaving(true);
    try {
      const result = await api.v2.create('leads', { ...form, photoUrl: photo, status: 'new', source: 'visualizer' });
      if (result.duplicate) { notify('Duplicate lead already exists — no new record created.'); return; }
      notify('Lead saved.');
      setForm({ customerName: '', propertyType: 'garage', address: '', appointment: '', floorCondition: 'fair', desiredFinish: '', squareFeet: 0, notes: '' });
      setPhoto('');
      await refresh();
    } catch (e) { notify('Save failed: ' + (e instanceof Error ? e.message : 'unknown error')); }
    finally { setSaving(false); }
  };

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="vx-page-header"><div><span className="vx-kicker">ONSITE LEAD CAPTURE</span><h1>New lead</h1><p>Capture verified customer details and site conditions.</p></div></div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Lead details</h2><VisualXProvenanceBadge status="VERIFIED" source="Operator-entered" /></div>
        <div className="vx-grid vx-grid-2">
          <VisualXField label="Customer name" error={errors.customerName} inputProps={{ value: form.customerName, onChange: e => set('customerName', e.target.value), placeholder: 'John Smith' }} />
          <VisualXField label="Project address" error={errors.address} inputProps={{ value: form.address, onChange: e => set('address', e.target.value), placeholder: '123 Main St, City, ST' }} />
          <VisualXSelect label="Property type" value={form.propertyType} onChange={v => set('propertyType', v)} options={[{ value: 'garage', label: 'Garage' }, { value: 'basement', label: 'Basement' }, { value: 'warehouse', label: 'Warehouse' }, { value: 'showroom', label: 'Showroom' }, { value: 'patio', label: 'Patio' }, { value: 'retail', label: 'Retail' }, { value: 'other', label: 'Other' }]} />
          <VisualXField label="Appointment date" inputProps={{ type: 'date', value: form.appointment, onChange: e => set('appointment', e.target.value) }} />
          <VisualXSelect label="Floor condition" value={form.floorCondition} onChange={v => set('floorCondition', v)} options={[{ value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' }]} />
          <VisualXField label="Square feet" inputProps={{ type: 'number', value: form.squareFeet, onChange: e => set('squareFeet', Number(e.target.value)) }} />
        </div>
        <VisualXField label="Desired finish / notes" textareaProps={{ value: form.notes, onChange: e => set('notes', e.target.value), placeholder: 'Customer finish preferences, special requirements...' }} />
      </div>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Site photo</h2></div>
        {photo ? (
          <div className="vx-photo" style={{ height: 200 }}><img src={photo} alt="Site" /></div>
        ) : (
          <label className="vx-btn outline-accent" style={{ cursor: 'pointer', width: '100%' }}>
            <Camera className="vx-icon" /> {uploading ? 'Uploading…' : 'Upload photo'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          </label>
        )}
      </div>
      <VisualXButton variant="primary" onClick={save} disabled={saving}><Save className="vx-icon" />{saving ? 'Saving…' : 'Save lead'}</VisualXButton>
      <div className="vx-card">
        <div className="vx-section-title"><h2>Recent leads</h2><span className="vx-muted">{leads.length} total</span></div>
        {leads.length === 0 ? <VisualXEmptyState title="No leads yet">Capture your first lead above.</VisualXEmptyState> : (
          <div className="project-list">
            {leads.slice(0, 8).map(l => (
              <div key={l.id} className="project-row">
                <div className="vx-icon-tile"><User className="vx-icon" /></div>
                <div><h3>{l.customerName}</h3><p><MapPin className="vx-icon vx-icon-sm" /> {l.address}</p><span className="vx-chip ready">{l.status}</span></div>
                <div className="project-side"><span className="vx-muted">{l.squareFeet} sq ft</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <VisualXBlockedState title="Automated follow-up disabled">
        <p>Customer email, SMS, and scheduled follow-ups remain disabled. Contact the customer manually after saving.</p>
      </VisualXBlockedState>
    </PullToRefresh>
  );
}