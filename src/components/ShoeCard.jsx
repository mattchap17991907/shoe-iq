import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const CAT_TO_STABILITY = { 'Supportive': 'structured', 'Plantar Fascitis': 'structured', 'Neutral': 'neutral' };
const CAT_TO_CUSHION   = { 'High Coushin': 'high', 'Soft Coushin': 'high', 'Low Coushin': 'low', 'Firm Coushin': 'low' };

const TIP_BY_STABILITY = { structured: 'stability_structured', neutral: 'stability_neutral', guidance: 'stability_guidance' };
const TIP_BY_CUSHION   = { high: 'cushion_high', medium: 'cushion_medium', low: 'cushion_low' };

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

export default function ShoeCard({ shoe, score, activeCategory, educationTips, dimmed }) {
  const [specs, setSpecs] = useState(shoe.specs || '');
  const [tipOpen, setTipOpen] = useState(false);

  async function handleBlur(e) {
    const val = e.target.value;
    const { error } = await supabase.from('shoes').update({ specs: val }).eq('id', shoe.id);
    if (error) console.error('Failed to save specs:', error.message);
  }

  const stability = resolveStability(shoe);
  const cushion   = resolveCushion(shoe);

  const tipCtx = TIP_BY_STABILITY[stability] || TIP_BY_CUSHION[cushion];
  const tip    = shoe.education_tip
    ? { tip: shoe.education_tip }
    : educationTips.find(t => t.context === tipCtx);

  return (
    <div className={`card${shoe.flagged ? ' flagged' : ''}${dimmed ? ' not-in-store' : ''}`}>
      {score != null && score > 0 && (
        <div className="match-score">{score} match{score === 1 ? '' : 'es'}</div>
      )}
      <div className="bib">#{shoe.id.slice(0, 4).toUpperCase()}</div>
      <div className="shoe-name">{shoe.display}</div>
      {shoe.brand && <div className="brand-name">{shoe.brand}</div>}
      {shoe.flagged && (
        <div className="flag-badge" title={shoe.flag_reason || 'Needs a data review'}>
          ⚠ Needs review
        </div>
      )}
      <div className="tags">
        {(shoe.categories || []).map(c => (
          <span key={c} className={`tag${c === activeCategory ? ' match' : ''}`}>{c}</span>
        ))}
      </div>
      <div className="specs-label">Shoe specs</div>
      <textarea
        placeholder="Weight, drop, price, etc."
        value={specs}
        onChange={e => setSpecs(e.target.value)}
        onBlur={handleBlur}
      />
      {tip && (
        <div className="education-tip-wrapper">
          <button className="education-tip-toggle" onClick={() => setTipOpen(v => !v)}>
            <span>💡</span> Why it works {tipOpen ? '▲' : '▼'}
          </button>
          {tipOpen && <div className="education-tip-body">{tip.tip}</div>}
        </div>
      )}
    </div>
  );
}
