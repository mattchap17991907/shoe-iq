import { useState } from 'react';

const REFERENCE_FIELDS = new Set(['sizeL', 'sizeR', 'footLength', 'heelWidth']);

const FIELDS = [
  { id: 'sizeL',       label: 'Foot size — left',        type: 'text',   placeholder: 'e.g. 9.5' },
  { id: 'sizeR',       label: 'Foot size — right',       type: 'text',   placeholder: 'e.g. 9.5' },
  { id: 'footLength',  label: 'Foot length',             type: 'text',   placeholder: 'mm (reference)' },
  { id: 'heelWidth',   label: 'Heel width',              type: 'select', options: ['Narrow', 'Medium', 'Wide'] },
  { id: 'ballWidth',   label: 'Ball width',              type: 'select', options: ['Narrow', 'Medium', 'Wide'] },
  { id: 'instepHeight',label: 'Instep height',           type: 'select', options: ['Low', 'Medium', 'High'] },
  { id: 'archHeight',  label: 'Arch height',             type: 'select', options: ['Low', 'Medium', 'High'] },
  { id: 'archFlex',    label: 'Arch flex',               type: 'select', options: ['Rigid', 'Moderate', 'Flexible'] },
  { id: 'pressureDist',label: 'Pressure distribution',  type: 'select', options: ['Medial', 'Centered', 'Lateral'] },
];

const PRESSURE_TIP_CTX  = { Medial: 'scan_pressure_medial', Lateral: 'scan_pressure_lateral' };
const ARCHFLEX_TIP_CTX  = { Rigid: 'scan_arch_rigid', Flexible: 'scan_arch_flexible' };
const CUSHION_TIP_CTX   = { low: 'cushion_low', medium: 'cushion_medium', high: 'cushion_high' };
const STABILITY_TIP_CTX = { neutral: 'stability_neutral', guidance: 'stability_guidance', structured: 'stability_structured' };

function inferTaxonomy(inputs) {
  const { archHeight, archFlex, pressureDist } = inputs;

  let cushion = 'medium';
  if (archHeight === 'Low' || archFlex === 'Flexible') cushion = 'high';
  else if (archHeight === 'High' && archFlex === 'Rigid') cushion = 'high';
  else if (archHeight === 'Medium' && archFlex === 'Moderate') cushion = 'medium';

  let stability = 'neutral';
  if (archFlex === 'Flexible' || pressureDist === 'Medial') stability = 'structured';
  else if (archFlex === 'Moderate' && pressureDist !== 'Lateral') stability = 'guidance';

  return { cushion, stability };
}

export default function ScanPanel({ scanRules, educationTips, onScanComplete, onCancel }) {
  const [inputs, setInputs] = useState({});
  const [profilePreview, setProfilePreview] = useState(null);

  function set(id, val) {
    setInputs(prev => ({ ...prev, [id]: val }));
    setProfilePreview(null);
  }

  function getTip(ctx) {
    return educationTips.find(t => t.context === ctx)?.tip;
  }

  function handleRun() {
    const active = {
      archHeight:   inputs.archHeight   || '',
      archFlex:     inputs.archFlex     || '',
      pressureDist: inputs.pressureDist || '',
      instepHeight: inputs.instepHeight || '',
      ballWidth:    inputs.ballWidth    || '',
    };

    const cats = new Set();
    scanRules.forEach(rule => {
      if (active[rule.field] === rule.value) cats.add(rule.category);
    });

    if (!cats.size) {
      alert('Select at least arch height, arch flex, pressure distribution, or ball/instep width to get a match.');
      return;
    }

    const { cushion, stability } = inferTaxonomy(active);
    setProfilePreview({ inputs: { ...inputs }, categories: Array.from(cats), cushion, stability });
  }

  const tipContexts = profilePreview
    ? [
        PRESSURE_TIP_CTX[profilePreview.inputs.pressureDist],
        ARCHFLEX_TIP_CTX[profilePreview.inputs.archFlex],
        CUSHION_TIP_CTX[profilePreview.cushion],
        STABILITY_TIP_CTX[profilePreview.stability],
      ].filter(Boolean)
    : [];

  return (
    <div className="panel scan-panel">
      <div className="panel-head">
        <span className="bar" />
        <h3>Volumental scan results</h3>
      </div>

      <div className="scan-grid">
        {FIELDS.map(f => (
          <div key={f.id}>
            <label>
              {f.label}
              {REFERENCE_FIELDS.has(f.id) && <span className="ref-tag">ref</span>}
            </label>
            {f.type === 'text' ? (
              <input
                type="text"
                placeholder={f.placeholder}
                value={inputs[f.id] || ''}
                onChange={e => set(f.id, e.target.value)}
              />
            ) : (
              <select value={inputs[f.id] || ''} onChange={e => set(f.id, e.target.value)}>
                <option value="">Select</option>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>

      <div className="actions">
        <button className="btn" onClick={handleRun}>Show matching shoes</button>
        <button className="btn secondary" onClick={onCancel}>Cancel</button>
      </div>

      <p className="scan-note">
        Foot size, length, and heel width are reference only — matching is driven by arch height/flex,
        pressure distribution, instep height, and ball width. Rules are staff-editable under <strong>Manage rules</strong>.
      </p>

      {profilePreview && (
        <div className="scan-profile-preview">
          <h4>Inferred fit profile</h4>
          <div className="profile-badges">
            {profilePreview.categories.map(c => (
              <span key={c} className="profile-badge category">{c}</span>
            ))}
            <span className="profile-badge cushion">Cushion: {profilePreview.cushion}</span>
            <span className="profile-badge stability">Stability: {profilePreview.stability}</span>
          </div>

          {tipContexts.map(ctx => {
            const tip = getTip(ctx);
            return tip ? (
              <div key={ctx} className="scan-education-tip">
                <span className="tip-badge">Outfitter tip</span>
                {tip}
              </div>
            ) : null;
          })}

          <div className="actions" style={{ marginTop: '16px' }}>
            <button className="btn" onClick={() => onScanComplete(profilePreview)}>
              Show matching shoes →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
