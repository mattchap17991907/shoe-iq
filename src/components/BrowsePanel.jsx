import { useState, useMemo } from 'react';
import FilterBar from './FilterBar.jsx';
import ShoeCard from './ShoeCard.jsx';

// ── Taxonomy inference from legacy categories ────────────────────────────────

const CAT_CUSHION = {
  'High Coushin': 'high', 'Soft Coushin': 'high',
  'Low Coushin': 'low',   'Firm Coushin': 'low',
};
const CAT_STABILITY = {
  'Supportive': 'structured', 'Plantar Fascitis': 'structured', 'Neutral': 'neutral',
};
const CAT_USE_CASE = {
  'Cross Country Runners': ['track_xc'],
  'Race Day Shoes':        ['road_running', 'track_xc'],
  'Cross Trainer':         ['road_running'],
  'Beginner Runners':      ['road_running'],
  'Concrete/Long Hours':   ['walking_workplace'],
  'Older People / Dr. Recs': ['walking_workplace'],
  'Neuropathy/ Diabetes':  ['walking_workplace'],
};

function effectiveCushion(shoe) {
  if (shoe.cushion_level) return shoe.cushion_level;
  for (const c of shoe.categories) if (CAT_CUSHION[c]) return CAT_CUSHION[c];
  return null;
}

function effectiveStability(shoe) {
  if (shoe.stability_level) return shoe.stability_level;
  for (const c of shoe.categories) if (CAT_STABILITY[c]) return CAT_STABILITY[c];
  return null;
}

function effectiveUseCase(shoe) {
  if (shoe.use_case?.length) return shoe.use_case;
  const result = new Set();
  for (const c of shoe.categories) (CAT_USE_CASE[c] || []).forEach(u => result.add(u));
  return result.size ? Array.from(result) : null;
}

function effectiveWidths(shoe) {
  return shoe.width_options || [];
}

const EMPTY_FILTERS = {
  search: '', category: '',
  useCase: [], cushionLevel: [], stabilityLevel: [], widthOptions: [], heelDrop: [],
};

export default function BrowsePanel({ shoes, categories, scanProfile, educationTips, onClearScan, onGoToScan }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const filtered = useMemo(() => {
    let list;

    if (scanProfile?.categories?.length) {
      list = shoes
        .map(s => ({ ...s, score: s.categories.filter(c => scanProfile.categories.includes(c)).length }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);
    } else {
      list = shoes.map(s => ({ ...s, score: null }));
    }

    return list.filter(s => {
      if (filters.search) {
        const t = filters.search.toLowerCase();
        if (!s.display.toLowerCase().includes(t) && !s.brand.toLowerCase().includes(t)) return false;
      }
      if (filters.category && !s.categories.includes(filters.category)) return false;

      if (filters.useCase.length) {
        const uc = effectiveUseCase(s);
        if (!uc || !filters.useCase.some(u => uc.includes(u))) return false;
      }
      if (filters.cushionLevel.length) {
        const cu = effectiveCushion(s);
        if (!cu || !filters.cushionLevel.includes(cu)) return false;
      }
      if (filters.stabilityLevel.length) {
        const st = effectiveStability(s);
        if (!st || !filters.stabilityLevel.includes(st)) return false;
      }
      if (filters.widthOptions.length) {
        const ws = effectiveWidths(s);
        if (!filters.widthOptions.some(w => ws.includes(w))) return false;
      }
      if (filters.heelDrop.length) {
        if (!s.heel_drop || !filters.heelDrop.includes(s.heel_drop)) return false;
      }
      return true;
    });
  }, [shoes, scanProfile, filters]);

  const label = `${filtered.length} shoe${filtered.length === 1 ? '' : 's'}${filters.category ? ` in "${filters.category}"` : ''}`;

  return (
    <div className="panel">
      {scanProfile && (
        <div className="scan-banner">
          <span>
            Scan match: <strong>{scanProfile.categories.join(', ')}</strong>
            {scanProfile.cushion && <> · Cushion: <strong>{scanProfile.cushion}</strong></>}
            {scanProfile.stability && <> · Stability: <strong>{scanProfile.stability}</strong></>}
          </span>
          <div className="scan-banner-actions">
            <button className="btn secondary sm" onClick={onGoToScan}>Edit scan</button>
            <button className="btn secondary sm" onClick={onClearScan}>Clear</button>
          </div>
        </div>
      )}

      <FilterBar filters={filters} categories={categories} onChange={setFilters} />

      <div className="count-row">
        <span className="count">{label}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No shoes match that filter combination. Try fewer filters or add the shoe via "+ Add new shoe."</div>
      ) : (
        <div className="grid">
          {filtered.map(s => (
            <ShoeCard
              key={s.id}
              shoe={s}
              score={s.score}
              activeCategory={filters.category}
              educationTips={educationTips}
            />
          ))}
        </div>
      )}
    </div>
  );
}
