import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const USE_CASE_OPTS = [
  { value: 'road_running',      label: 'Road Running' },
  { value: 'trail_running',     label: 'Trail Running' },
  { value: 'track_xc',          label: 'Track & Field / XC' },
  { value: 'walking_workplace', label: 'Walking & Workplace' },
  { value: 'recovery',          label: 'Recovery' },
];
const WIDTH_OPTS = [
  { value: 'narrow',     label: 'Narrow (B)' },
  { value: 'standard',   label: 'Standard (D)' },
  { value: 'wide',       label: 'Wide (2E)' },
  { value: 'extra_wide', label: 'Extra Wide (4E)' },
];

function Chips({ options, selected, onToggle, single }) {
  return (
    <div className="option-chips">
      {options.map(o => (
        <button
          key={o.value ?? o}
          type="button"
          className={`filter-chip${selected.includes(o.value ?? o) ? ' active' : ''}`}
          onClick={() => onToggle(o.value ?? o)}
        >
          {o.label ?? o}
        </button>
      ))}
    </div>
  );
}

function toggleItem(arr, val, single) {
  if (single) return arr.includes(val) ? [] : [val];
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export default function AddShoePanel({ categories, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [selCats, setSelCats] = useState(new Set());
  const [useCase, setUseCase] = useState([]);
  const [cushion, setCushion] = useState([]);
  const [stability, setStability] = useState([]);
  const [widths, setWidths] = useState([]);
  const [drop, setDrop] = useState([]);
  const [volume, setVolume] = useState([]);
  const [tip, setTip] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleCat(cat) {
    setSelCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  }

  async function handleSave() {
    if (!name.trim()) { document.getElementById('newShoeName')?.focus(); return; }
    setSaving(true);
    const { data, error } = await supabase
      .from('shoes')
      .insert({
        display:         name.trim(),
        brand:           brand.trim(),
        categories:      Array.from(selCats),
        specs:           '',
        use_case:        useCase,
        cushion_level:   cushion[0] || null,
        stability_level: stability[0] || null,
        width_options:   widths,
        heel_drop:       drop[0] || null,
        fit_volume:      volume[0] || null,
        education_tip:   tip.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) { alert('Could not save shoe: ' + error.message); return; }
    onSave(data);
    // reset
    setName(''); setBrand(''); setSelCats(new Set());
    setUseCase([]); setCushion([]); setStability([]);
    setWidths([]); setDrop([]); setVolume([]); setTip('');
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="bar" />
        <h3>Add a new shoe to the floor</h3>
      </div>

      <div className="add-form">
        <div className="form-row">
          <div className="form-field">
            <label>Shoe name <span className="required">*</span></label>
            <input id="newShoeName" type="text" placeholder="e.g. Glycerin 22" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Brand</label>
            <input type="text" placeholder="e.g. Brooks" value={brand} onChange={e => setBrand(e.target.value)} />
          </div>
        </div>

        <div className="form-section">
          <label>Use case (select all that apply)</label>
          <Chips options={USE_CASE_OPTS} selected={useCase} onToggle={v => setUseCase(p => toggleItem(p, v, false))} />
        </div>

        <div className="form-row">
          <div className="form-section">
            <label>Cushion level</label>
            <Chips
              options={['low','medium','high'].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }))}
              selected={cushion}
              onToggle={v => setCushion(p => toggleItem(p, v, true))}
            />
          </div>
          <div className="form-section">
            <label>Stability level</label>
            <Chips
              options={['neutral','guidance','structured'].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }))}
              selected={stability}
              onToggle={v => setStability(p => toggleItem(p, v, true))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-section">
            <label>Width options available</label>
            <Chips options={WIDTH_OPTS} selected={widths} onToggle={v => setWidths(p => toggleItem(p, v, false))} />
          </div>
          <div className="form-section">
            <label>Heel-to-toe drop</label>
            <Chips
              options={['zero','low','standard'].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }))}
              selected={drop}
              onToggle={v => setDrop(p => toggleItem(p, v, true))}
            />
          </div>
        </div>

        <div className="form-section">
          <label>Fit volume</label>
          <Chips
            options={['low','medium','high'].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }))}
            selected={volume}
            onToggle={v => setVolume(p => toggleItem(p, v, true))}
          />
        </div>

        <div className="form-section">
          <label>Legacy categories (for existing filter / scan match)</label>
          <div className="cat-checks">
            {categories.map(c => (
              <label key={c.id} className="cat-check">
                <input type="checkbox" checked={selCats.has(c.name)} onChange={() => toggleCat(c.name)} />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label>Education tip — "Why it works" (optional)</label>
          <textarea
            rows={3}
            placeholder="e.g. GuideRails technology provides adaptive guidance only when the foot needs it, without restricting natural motion."
            value={tip}
            onChange={e => setTip(e.target.value)}
          />
        </div>

        <div className="actions">
          <button className="btn" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save shoe'}
          </button>
          <button className="btn secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
