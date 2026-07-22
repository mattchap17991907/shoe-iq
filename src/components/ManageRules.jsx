import { useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const FIELD_LABELS = {
  archHeight:   'Arch height',
  archFlex:     'Arch flex',
  pressureDist: 'Pressure distribution',
  instepHeight: 'Instep height',
  ballWidth:    'Ball width',
};

export default function ManageRules({
  shoes, setShoes,
  activeStore,
  scanRules, setScanRules,
  insertTriggers, setInsertTriggers,
  painPointInserts, setPainPointInserts,
  categories,
}) {
  const [newRule, setNewRule]       = useState({ field: 'archHeight', value: '', category: '' });
  const [newTrigger, setNewTrigger] = useState({ key: '', label: '', insert_name: '', why: '' });
  const [invSearch, setInvSearch]   = useState('');

  // ── Store inventory ─────────────────────────────────────────────────────────

  async function toggleInStore(shoe) {
    const next = shoe.in_store === false ? true : false;
    const { error } = await supabase.from('shoes').update({ in_store: next }).eq('id', shoe.id);
    if (error) { alert('Could not update inventory: ' + error.message); return; }
    setShoes(prev => prev.map(s => s.id === shoe.id ? { ...s, in_store: next } : s));
  }

  const invFiltered = (shoes || [])
    .filter(s => {
      if (!invSearch.trim()) return true;
      const t = invSearch.toLowerCase();
      return s.display.toLowerCase().includes(t) || s.brand.toLowerCase().includes(t);
    })
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.display.localeCompare(b.display));

  const inStoreCount = (shoes || []).filter(s => s.in_store !== false).length;

  // ── Scan rules ──────────────────────────────────────────────────────────────

  async function deleteRule(id) {
    const { error } = await supabase.from('scan_rules').delete().eq('id', id);
    if (error) { alert('Could not remove: ' + error.message); return; }
    setScanRules(prev => prev.filter(r => r.id !== id));
  }

  async function addRule() {
    if (!newRule.value.trim() || !newRule.category) { alert('Enter a value and pick a category.'); return; }
    const { data, error } = await supabase.from('scan_rules')
      .insert({ field: newRule.field, value: newRule.value.trim(), category: newRule.category, sort_order: scanRules.length })
      .select().single();
    if (error) { alert('Could not add: ' + error.message); return; }
    setScanRules(prev => [...prev, data]);
    setNewRule(p => ({ ...p, value: '' }));
  }

  // ── Insert triggers ─────────────────────────────────────────────────────────

  async function deleteTrigger(id) {
    const { error } = await supabase.from('insert_triggers').delete().eq('id', id);
    if (error) { alert('Could not remove: ' + error.message); return; }
    setInsertTriggers(prev => prev.filter(t => t.id !== id));
  }

  async function addTrigger() {
    const { key, label, insert_name, why } = newTrigger;
    if (!key || !label || !insert_name || !why) { alert('Fill in all four fields.'); return; }
    const { data, error } = await supabase.from('insert_triggers')
      .insert({ key, label, insert_name, why, sort_order: insertTriggers.length })
      .select().single();
    if (error) { alert('Could not add: ' + error.message); return; }
    setInsertTriggers(prev => [...prev, data]);
    setNewTrigger({ key: '', label: '', insert_name: '', why: '' });
  }

  // ── Pain-point inserts ──────────────────────────────────────────────────────

  async function deletePainPoint(id) {
    const { error } = await supabase.from('pain_point_inserts').delete().eq('id', id);
    if (error) { alert('Could not remove: ' + error.message); return; }
    setPainPointInserts(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="panel manage-panel">
      <div className="panel-head">
        <span className="bar" />
        <h3>Manage rules</h3>
      </div>
      <p className="panel-note">
        These tables drive the <strong>Start from a scan</strong> inference and the <strong>Insert finder</strong>.
        Staff-editable — get a fitter's sign-off before relying on changes here.
      </p>

      {/* ── Store inventory ── */}
      <section>
        <h4>
          Store inventory
          {activeStore && <span className="store-tag">{activeStore.city}, {activeStore.state}</span>}
          <span className="inv-count">{inStoreCount} of {(shoes||[]).length} in store</span>
        </h4>
        <p className="panel-note" style={{ marginTop: 0 }}>
          Toggle which shoes this store currently carries. Only in-store shoes appear in the Browse view by default.
        </p>
        <input
          type="text"
          placeholder="Search shoes…"
          value={invSearch}
          onChange={e => setInvSearch(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <div className="inv-list">
          {invFiltered.map(s => (
            <div key={s.id} className={`inv-row${s.in_store === false ? ' inv-out' : ''}`}>
              <span className="inv-name">
                <span className="inv-brand">{s.brand}</span>
                {s.display}
              </span>
              <button
                className={`inv-toggle${s.in_store === false ? '' : ' in-store'}`}
                onClick={() => toggleInStore(s)}
              >
                {s.in_store === false ? 'Not carried' : 'In store'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scan rules ── */}
      <section>
        <h4>Scan → category rules</h4>
        <div className="table-wrap">
          <table className="rules-table">
            <thead>
              <tr><th>Scan field</th><th>Value</th><th>Implies category</th><th></th></tr>
            </thead>
            <tbody>
              {scanRules.map(r => (
                <tr key={r.id}>
                  <td>{FIELD_LABELS[r.field] || r.field}</td>
                  <td>{r.value}</td>
                  <td>{r.category}</td>
                  <td><button className="btn danger" onClick={() => deleteRule(r.id)}>Remove</button></td>
                </tr>
              ))}
              {!scanRules.length && <tr><td colSpan={4} style={{color:'var(--ink-soft)'}}>No rules yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="add-row">
          <select value={newRule.field} onChange={e => setNewRule(p => ({ ...p, field: e.target.value }))}>
            {Object.entries(FIELD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input type="text" placeholder="Value (e.g. High)" value={newRule.value} onChange={e => setNewRule(p => ({ ...p, value: e.target.value }))} />
          <select value={newRule.category} onChange={e => setNewRule(p => ({ ...p, category: e.target.value }))}>
            <option value="">Pick category</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button className="btn" onClick={addRule}>Add rule</button>
        </div>
      </section>

      {/* ── Insert triggers ── */}
      <section>
        <h4>Insert finder — situational triggers</h4>
        <div className="table-wrap">
          <table className="rules-table">
            <thead>
              <tr><th>Label</th><th>Recommended insert</th><th>Why</th><th></th></tr>
            </thead>
            <tbody>
              {insertTriggers.map(t => (
                <tr key={t.id}>
                  <td>{t.label}</td>
                  <td>{t.insert_name}</td>
                  <td style={{ maxWidth: '240px' }}>{t.why}</td>
                  <td><button className="btn danger" onClick={() => deleteTrigger(t.id)}>Remove</button></td>
                </tr>
              ))}
              {!insertTriggers.length && <tr><td colSpan={4} style={{color:'var(--ink-soft)'}}>No triggers yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="add-row">
          <input type="text" placeholder="key (e.g. wide_foot_needs_plate)" value={newTrigger.key} onChange={e => setNewTrigger(p => ({ ...p, key: e.target.value }))} />
          <input type="text" placeholder="Checkbox label" value={newTrigger.label} onChange={e => setNewTrigger(p => ({ ...p, label: e.target.value }))} />
          <input type="text" placeholder="Recommended insert" value={newTrigger.insert_name} onChange={e => setNewTrigger(p => ({ ...p, insert_name: e.target.value }))} />
          <input type="text" placeholder="Why (rationale)" value={newTrigger.why} onChange={e => setNewTrigger(p => ({ ...p, why: e.target.value }))} />
          <button className="btn" onClick={addTrigger}>Add trigger</button>
        </div>
      </section>

      {/* ── Pain-point inserts ── */}
      <section>
        <h4>Insert finder — pain point mappings</h4>
        <p className="panel-note" style={{ marginTop: 0 }}>
          Drives the "Pain points / complaints" section of the Insert Finder. Seed 8 defaults by running <code>supabase/migration.sql</code> if this table is empty.
        </p>
        <div className="table-wrap">
          <table className="rules-table">
            <thead>
              <tr><th>Pain point</th><th>Recommended insert</th><th>Why</th><th></th></tr>
            </thead>
            <tbody>
              {painPointInserts.map(p => (
                <tr key={p.id}>
                  <td>{p.pain_point_label}</td>
                  <td>{p.insert_name}</td>
                  <td style={{ maxWidth: '240px' }}>{p.why}</td>
                  <td><button className="btn danger" onClick={() => deletePainPoint(p.id)}>Remove</button></td>
                </tr>
              ))}
              {!painPointInserts.length && (
                <tr><td colSpan={4} style={{color:'var(--ink-soft)'}}>
                  No entries — run migration.sql in the Supabase SQL editor to seed 8 defaults.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
