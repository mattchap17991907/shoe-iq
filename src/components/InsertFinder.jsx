import { useState } from 'react';

const ARCH_TIP_CTX = { Low: 'insert_arch_low', Medium: 'insert_arch_medium', High: 'insert_arch_high' };

export default function InsertFinder({ insertTriggers, archColorMap, painPointInserts, educationTips, onCancel }) {
  const [archHeight, setArchHeight] = useState('');
  const [checkedPain, setCheckedPain] = useState(new Set());
  const [checkedTriggers, setCheckedTriggers] = useState(new Set());
  const [results, setResults] = useState(null); // null | 'empty' | object

  function togglePain(key) {
    setCheckedPain(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    setResults(null);
  }

  function toggleTrigger(key) {
    setCheckedTriggers(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    setResults(null);
  }

  function getTip(ctx) {
    return educationTips.find(t => t.context === ctx)?.tip;
  }

  function handleRecommend() {
    if (!archHeight && !checkedPain.size && !checkedTriggers.size) {
      setResults('empty');
      return;
    }

    const recs = {}; // { insertName: { reasons, tips } }
    function addRec(name, why, tip) {
      if (!recs[name]) recs[name] = { reasons: [], tips: [] };
      recs[name].reasons.push(why);
      if (tip && !recs[name].tips.includes(tip)) recs[name].tips.push(tip);
    }

    painPointInserts.filter(p => checkedPain.has(p.pain_point_key)).forEach(p =>
      addRec(p.insert_name, p.why, p.education_tip)
    );
    insertTriggers.filter(t => checkedTriggers.has(t.key)).forEach(t =>
      addRec(t.insert_name, t.why, null)
    );

    const archTipCtx = ARCH_TIP_CTX[archHeight];
    setResults({
      archHeight,
      archColors: archColorMap[archHeight] || null,
      archTip: archTipCtx ? getTip(archTipCtx) : null,
      recs,
    });
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="bar" />
        <h3>Insert finder</h3>
      </div>

      <div className="insert-layout">
        {/* ── Left: inputs ── */}
        <div className="insert-inputs">
          <div className="insert-section">
            <h4>Arch height</h4>
            <div className="arch-chips">
              {['Low', 'Medium', 'High'].map(a => (
                <button
                  key={a}
                  className={`arch-chip${archHeight === a ? ' active' : ''}`}
                  onClick={() => { setArchHeight(archHeight === a ? '' : a); setResults(null); }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {painPointInserts.length > 0 && (
            <div className="insert-section">
              <h4>Pain points / complaints</h4>
              <div className="check-grid">
                {painPointInserts.map(p => (
                  <label key={p.pain_point_key} className="cat-check">
                    <input
                      type="checkbox"
                      checked={checkedPain.has(p.pain_point_key)}
                      onChange={() => togglePain(p.pain_point_key)}
                    />
                    {p.pain_point_label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {insertTriggers.length > 0 && (
            <div className="insert-section">
              <h4>Situational notes</h4>
              <div className="check-grid">
                {insertTriggers.map(t => (
                  <label key={t.key} className="cat-check">
                    <input
                      type="checkbox"
                      checked={checkedTriggers.has(t.key)}
                      onChange={() => toggleTrigger(t.key)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="actions">
            <button className="btn" onClick={handleRecommend}>Recommend insert</button>
            <button className="btn secondary" onClick={onCancel}>Cancel</button>
          </div>
        </div>

        {/* ── Right: results ── */}
        <div className="insert-results">
          {results === null && (
            <div className="results-placeholder">
              Select an arch height and / or any pain points and situational notes that apply, then click <strong>Recommend insert</strong>.
            </div>
          )}

          {results === 'empty' && (
            <div className="results-placeholder">Select at least one option to get a recommendation.</div>
          )}

          {results && results !== 'empty' && (
            <>
              {results.archColors && (
                <div className="insert-result arch-reference">
                  <h4>Arch color reference — {results.archHeight}</h4>
                  <p className="why">
                    <span className="swatch" style={{ background: results.archColors.curex_hex }} />
                    Currex: <strong>{results.archColors.curex_label}</strong>
                    &nbsp;·&nbsp;
                    Superfeet: <strong>{results.archColors.superfeet_label}</strong>
                  </p>
                  {results.archTip && (
                    <div className="education-tip-body" style={{ marginTop: '8px' }}>
                      <span className="tip-badge">Outfitter tip</span>
                      {results.archTip}
                    </div>
                  )}
                </div>
              )}

              {!Object.keys(results.recs).length && !results.archColors && (
                <div className="results-placeholder">No triggers matched. Try selecting pain points or situational notes.</div>
              )}

              {Object.entries(results.recs).map(([name, { reasons, tips }]) => (
                <div key={name} className="insert-result">
                  <h4>{name}</h4>
                  <p className="why">{reasons.join(' ')}</p>
                  {tips.map((tip, i) => (
                    <div key={i} className="education-tip-body">
                      <span className="tip-badge">Outfitter tip</span>
                      {tip}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
