import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const CAT_TO_STABILITY = { 'Supportive': 'structured', 'Plantar Fascitis': 'structured', 'Neutral': 'neutral' };
const CAT_TO_CUSHION   = { 'High Coushin': 'high', 'Soft Coushin': 'high', 'Low Coushin': 'low', 'Firm Coushin': 'low' };

const TIP_BY_STABILITY = { structured: 'stability_structured', neutral: 'stability_neutral', guidance: 'stability_guidance' };
const TIP_BY_CUSHION   = { high: 'cushion_high', medium: 'cushion_medium', low: 'cushion_low' };

function getDropLabel(d) {
  if (!d) return '—';
  if (d.includes('mm')) return d;
  return { zero: '0 mm', low: 'Low', standard: 'Standard' }[d] ?? d;
}
const FOAM_LABELS  = { 1: 'Firm', 2: 'Medium-Firm', 3: 'Medium', 4: 'Soft', 5: 'Plush' };

function resolveStability(shoe) {
  if (shoe.stability_level) return shoe.stability_level;
  for (const cat of (shoe.categories || [])) if (CAT_TO_STABILITY[cat]) return CAT_TO_STABILITY[cat];
  return null;
}

function resolveCushion(shoe) {
  if (shoe.cushion_level) return shoe.cushion_level;
  for (const cat of (shoe.categories || [])) if (CAT_TO_CUSHION[cat]) return CAT_TO_CUSHION[cat];
  return null;
}

export default function ShoeCard({ shoe, score, activeCategory, educationTips, featureNotes, dimmed, onRequirePin }) {
  const [weight,         setWeight]         = useState(shoe.weight         || '');
  const [foamScore,      setFoamScore]      = useState(shoe.foam_score     ?? null);
  const [foamResponsive, setFoamResponsive] = useState(shoe.foam_responsive ?? false);
  const [editMode,       setEditMode]       = useState(false);
  const [tipOpen,        setTipOpen]        = useState(false);

  async function handleEditSpecs() {
    const ok = await onRequirePin();
    if (ok) setEditMode(true);
  }

  async function saveWeight(val) {
    const { error } = await supabase.from('shoes').update({ weight: val }).eq('id', shoe.id);
    if (error) console.error('Failed to save weight:', error.message);
  }

  async function handleFoamDot(i) {
    const next = foamScore === i ? null : i;
    setFoamScore(next);
    await supabase.from('shoes').update({ foam_score: next }).eq('id', shoe.id);
  }

  async function handleFoamResponsive(val) {
    setFoamResponsive(val);
    await supabase.from('shoes').update({ foam_responsive: val }).eq('id', shoe.id);
  }

  const stability = resolveStability(shoe);
  const cushion   = resolveCushion(shoe);
  const tipCtx    = TIP_BY_STABILITY[stability] || TIP_BY_CUSHION[cushion];
  const tip       = shoe.education_tip
    ? { tip: shoe.education_tip }
    : educationTips.find(t => t.context === tipCtx);

  const lightbulbContent = featureNotes || tip?.tip;
  const dropLabel = getDropLabel(shoe.heel_drop);

  return (
    <div className={`card${shoe.flagged ? ' flagged' : ''}${dimmed ? ' not-in-store' : ''}`}>
      {score != null && score > 0 && (
        <div className="match-score">{score} match{score === 1 ? '' : 'es'}</div>
      )}
      <div className="bib">#{shoe.id.slice(0, 4).toUpperCase()}</div>
      <div className="shoe-name">{shoe.display}</div>
      {shoe.brand && <div className="brand-name">{shoe.brand}</div>}
      {shoe.flagged && (
        <div className="flag-badge" title={shoe.flag_reason || 'Needs a data review'}>⚠ Needs review</div>
      )}
      <div className="tags">
        {(shoe.categories || []).map(c => (
          <span key={c} className={`tag${c === activeCategory ? ' match' : ''}`}>{c}</span>
        ))}
      </div>

      <div className="specs-label">
        Specs
        {editMode
          ? <button className="edit-specs-btn done" onClick={() => setEditMode(false)}>Done</button>
          : <button className="edit-specs-btn" onClick={handleEditSpecs} title="Edit specs">✎</button>
        }
      </div>

      <div className="specs-row">
        {/* Drop — always read-only, managed via taxonomy */}
        <div className="spec-item">
          <span className="spec-field-label">Drop</span>
          <span className="spec-value">{dropLabel}</span>
        </div>

        {/* Weight */}
        <div className="spec-item">
          <span className="spec-field-label">Weight</span>
          {editMode
            ? <input
                className="spec-input"
                placeholder="e.g. 8.4 oz"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                onBlur={e => saveWeight(e.target.value)}
              />
            : <span className="spec-value">{weight || '—'}</span>
          }
        </div>

        {/* Foam feel bar */}
        <div className="spec-item foam-item">
          <span className="spec-field-label">Foam feel</span>
          <div className="foam-bar">
            {[1,2,3,4,5].map(i =>
              editMode
                ? <button key={i} className={`foam-dot${(foamScore || 0) >= i ? ' filled' : ''}`} onClick={() => handleFoamDot(i)} />
                : <span    key={i} className={`foam-dot${(foamScore || 0) >= i ? ' filled' : ''}`} />
            )}
            {foamResponsive && !editMode && <span className="foam-badge" title="Responsive foam">⚡</span>}
          </div>
          {(foamScore || foamResponsive) && (
            <div className="foam-meta">
              {foamScore && <span className="foam-label">{FOAM_LABELS[foamScore]}</span>}
              {foamResponsive && foamScore && <span className="foam-sep">·</span>}
              {foamResponsive && <span className="foam-label">Responsive</span>}
            </div>
          )}
          {editMode && (
            <label className="foam-responsive-label">
              <input
                type="checkbox"
                checked={foamResponsive}
                onChange={e => handleFoamResponsive(e.target.checked)}
              />
              ⚡ Responsive
            </label>
          )}
        </div>
      </div>

      {lightbulbContent && (
        <div className="education-tip-wrapper">
          <button className="education-tip-toggle" onClick={() => setTipOpen(v => !v)}>
            <span>💡</span> Why it works {tipOpen ? '▲' : '▼'}
          </button>
          {tipOpen && <div className="education-tip-body">{lightbulbContent}</div>}
        </div>
      )}
    </div>
  );
}
