import { useState } from 'react';

const USE_CASES = [
  { value: 'road_running',      label: 'Road Running' },
  { value: 'trail_running',     label: 'Trail' },
  { value: 'track_xc',          label: 'Track / XC' },
  { value: 'walking_workplace', label: 'Walking / Workplace' },
  { value: 'recovery',          label: 'Recovery' },
  { value: 'plated_speed',      label: 'Plated Speed' },
  { value: 'non_plated_speed',  label: 'Non-Plated Speed' },
];

const CUSHION_LEVELS = [
  { value: 'low',    label: 'Low cushion' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'Max cushion' },
];

const STABILITY_LEVELS = [
  { value: 'neutral',    label: 'Neutral' },
  { value: 'guidance',   label: 'Guidance' },
  { value: 'structured', label: 'Structured' },
];

const WIDTH_OPTIONS = [
  { value: 'runs_narrow', label: 'Runs Narrow' },
  { value: 'runs_wide',   label: 'Runs Wide / Toe Box' },
];

const DROP_OPTIONS = [
  { value: 'zero', label: 'Zero drop' },
  { value: 'low',  label: 'Low drop' },
];

const EMPTY_FILTERS = {
  search: '', category: '',
  useCase: [], cushionLevel: [], stabilityLevel: [], widthOptions: [], heelDrop: [],
};

export default function FilterBar({ filters, categories, onChange }) {
  const [chipsOpen, setChipsOpen] = useState(false);

  function toggle(field, value) {
    const cur = filters[field] || [];
    onChange({ ...filters, [field]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] });
  }

  function active(field, value) {
    return (filters[field] || []).includes(value);
  }

  const activeChipCount = (
    (filters.useCase?.length || 0) +
    (filters.cushionLevel?.length || 0) +
    (filters.stabilityLevel?.length || 0) +
    (filters.widthOptions?.length || 0) +
    (filters.heelDrop?.length || 0)
  );

  const hasActive = !!(filters.search || filters.category || activeChipCount);

  function ChipRow({ label, field, options }) {
    return (
      <div className="filter-row">
        <span className="filter-label">{label}</span>
        {options.map(o => (
          <button
            key={o.value}
            className={`filter-chip${active(field, o.value) ? ' active' : ''}`}
            onClick={() => toggle(field, o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="filter-bar">
      <div className="filter-row filter-row-top">
        <input
          type="text"
          placeholder="Search by shoe name or brand…"
          value={filters.search || ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
        />
        <select value={filters.category || ''} onChange={e => onChange({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <button
        className={`filter-toggle-btn${chipsOpen ? ' open' : ''}`}
        onClick={() => setChipsOpen(o => !o)}
      >
        <span>Filters</span>
        {activeChipCount > 0 && <span className="filter-toggle-badge">{activeChipCount}</span>}
        <span className="filter-toggle-chevron">{chipsOpen ? '▲' : '▼'}</span>
      </button>

      <div className={`filter-chips-body${chipsOpen ? ' open' : ''}`}>
        <ChipRow label="Use case"  field="useCase"        options={USE_CASES} />
        <ChipRow label="Cushion"   field="cushionLevel"   options={CUSHION_LEVELS} />
        <ChipRow label="Stability" field="stabilityLevel" options={STABILITY_LEVELS} />
        <ChipRow label="Width"     field="widthOptions"   options={WIDTH_OPTIONS} />
        <ChipRow label="Drop"      field="heelDrop"       options={DROP_OPTIONS} />

        {hasActive && (
          <div className="filter-row">
            <button className="btn secondary sm clear-filters" onClick={() => { onChange(EMPTY_FILTERS); setChipsOpen(false); }}>
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
