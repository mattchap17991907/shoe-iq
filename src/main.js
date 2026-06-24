import './styles.css';
import { supabase } from './supabaseClient.js';
import { requirePin } from './pin.js';

// ---------------------------------------------------------------------------
// State (hydrated from Supabase on load, kept in sync as staff make edits)
// ---------------------------------------------------------------------------

let categories = [];      // [{id, name, sort_order}]
let shoes = [];            // [{id, display, brand, categories, specs, flagged, flag_reason}]
let scanRules = [];        // [{id, field, value, category, sort_order}]
let insertTriggers = [];   // [{id, key, label, insert_name, why, sort_order}]
let archColorMap = {};     // { Low: {curex_label, curex_hex, superfeet_label}, ... }
let scanCategories = null; // array of inferred categories when in scan mode, else null

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------

const categorySelect = document.getElementById('categorySelect');
const searchBox = document.getElementById('searchBox');
const grid = document.getElementById('shoeGrid');
const countLabel = document.getElementById('countLabel');
const emptyState = document.getElementById('emptyState');

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

async function loadAll() {
  const [catRes, shoeRes, ruleRes, triggerRes, colorRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('shoes').select('*').order('display'),
    supabase.from('scan_rules').select('*').order('sort_order'),
    supabase.from('insert_triggers').select('*').order('sort_order'),
    supabase.from('arch_color_map').select('*'),
  ]);

  for (const [label, res] of [['categories', catRes], ['shoes', shoeRes], ['scan_rules', ruleRes], ['insert_triggers', triggerRes], ['arch_color_map', colorRes]]) {
    if (res.error) console.error(`Failed to load ${label}:`, res.error.message);
  }

  categories = catRes.data || [];
  shoes = shoeRes.data || [];
  scanRules = ruleRes.data || [];
  insertTriggers = triggerRes.data || [];
  archColorMap = {};
  (colorRes.data || []).forEach(row => {
    archColorMap[row.arch_height] = row;
  });
}

// ---------------------------------------------------------------------------
// Browse / search / filter
// ---------------------------------------------------------------------------

function populateCategorySelect() {
  categorySelect.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = ''; opt.textContent = 'All categories';
  categorySelect.appendChild(opt);
  categories.forEach(c => {
    const o = document.createElement('option');
    o.value = c.name; o.textContent = c.name;
    categorySelect.appendChild(o);
  });
}

function render() {
  const term = searchBox.value.trim().toLowerCase();
  const cat = categorySelect.value;
  let filtered;

  if (scanCategories && scanCategories.length) {
    filtered = shoes
      .map(s => ({ shoe: s, score: s.categories.filter(c => scanCategories.includes(c)).length }))
      .filter(x => x.score > 0)
      .filter(x => !term || x.shoe.display.toLowerCase().includes(term) || x.shoe.brand.toLowerCase().includes(term))
      .filter(x => !cat || x.shoe.categories.includes(cat))
      .sort((a, b) => b.score - a.score)
      .map(x => ({ ...x.shoe, score: x.score }));
  } else {
    filtered = shoes.filter(s => {
      const matchesTerm = !term || s.display.toLowerCase().includes(term) || s.brand.toLowerCase().includes(term);
      const matchesCat = !cat || s.categories.includes(cat);
      return matchesTerm && matchesCat;
    });
  }

  countLabel.textContent = filtered.length + ' shoe' + (filtered.length === 1 ? '' : 's') + (cat ? ' in "' + cat + '"' : ' total');
  grid.innerHTML = '';
  emptyState.style.display = filtered.length ? 'none' : 'block';

  filtered.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'card' + (s.flagged ? ' flagged' : '');
    card.innerHTML = `
      ${s.score ? `<div class="match-score">${s.score} match${s.score === 1 ? '' : 'es'}</div>` : ''}
      <div class="bib">#${s.id.slice(0, 4).toUpperCase()}</div>
      <div class="name">${s.display}</div>
      ${s.brand ? `<div class="brand-name">${s.brand}</div>` : ''}
      ${s.flagged ? `<div class="flag-badge" title="${s.flag_reason || 'Needs a data review'}">&#x26A0; Needs review</div>` : ''}
      <div class="tags">${s.categories.map(c => `<span class="tag${(c === cat || (scanCategories && scanCategories.includes(c))) ? ' match' : ''}">${c}</span>`).join('')}</div>
      <div class="specs-label">Shoe specs</div>
      <textarea data-id="${s.id}" placeholder="Weight, drop, price, etc.">${s.specs || ''}</textarea>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('textarea').forEach(t => {
    t.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const shoe = shoes.find(s => s.id === id);
      if (!shoe) return;
      shoe.specs = e.target.value;
      const { error } = await supabase.from('shoes').update({ specs: e.target.value }).eq('id', id);
      if (error) console.error('Failed to save specs:', error.message);
    });
  });
}

categorySelect.addEventListener('change', render);
searchBox.addEventListener('input', render);

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const PANEL_BY_TAB = { browse: 'browsePanel', scan: 'scanPanel', insert: 'insertPanel', checklist: 'checklistPanel', add: 'addPanel', manage: 'managePanel' };
const PIN_GATED_TABS = new Set(['add', 'manage']);

function activateTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  Object.values(PANEL_BY_TAB).forEach(id => document.getElementById(id).classList.remove('open'));
  document.getElementById(PANEL_BY_TAB[tabName]).classList.add('open');
}

document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', async () => {
    const tabName = t.dataset.tab;
    if (PIN_GATED_TABS.has(tabName)) {
      const ok = await requirePin();
      if (!ok) return;
    }
    activateTab(tabName);
  });
});

// ---------------------------------------------------------------------------
// Add-shoe panel
// ---------------------------------------------------------------------------

const newCats = document.getElementById('newCats');
const cancelAdd = document.getElementById('cancelAdd');
const saveShoe = document.getElementById('saveShoe');

function renderNewCats() {
  newCats.innerHTML = '';
  categories.forEach(c => {
    const label = document.createElement('label');
    label.className = 'cat-check';
    label.innerHTML = `<input type="checkbox" value="${c.name}"> ${c.name}`;
    newCats.appendChild(label);
  });
}

cancelAdd.addEventListener('click', () => {
  activateTab('browse');
  document.getElementById('newName').value = '';
  document.getElementById('newBrand').value = '';
  newCats.querySelectorAll('input').forEach(i => i.checked = false);
});

saveShoe.addEventListener('click', async () => {
  const name = document.getElementById('newName').value.trim();
  const brand = document.getElementById('newBrand').value.trim();
  const checked = Array.from(newCats.querySelectorAll('input:checked')).map(i => i.value);
  if (!name) { document.getElementById('newName').focus(); return; }

  saveShoe.disabled = true;
  const { data, error } = await supabase
    .from('shoes')
    .insert({ display: name, brand, categories: checked, specs: '' })
    .select()
    .single();
  saveShoe.disabled = false;

  if (error) {
    alert('Could not save shoe: ' + error.message);
    return;
  }
  shoes.push(data);
  cancelAdd.click();
  render();
});

// ---------------------------------------------------------------------------
// Scan panel
// ---------------------------------------------------------------------------

const cancelScan = document.getElementById('cancelScan');
const runScan = document.getElementById('runScan');
const scanBanner = document.getElementById('scanBanner');

function clearScanInputs() {
  ['sizeL', 'sizeR', 'footLength', 'heelWidth', 'ballWidth', 'instepHeight', 'archHeight', 'archFlex', 'pressureDist'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

cancelScan.addEventListener('click', () => {
  activateTab('browse');
});

function inferCategoriesFromScan() {
  const inputs = {
    archHeight: document.getElementById('archHeight').value,
    archFlex: document.getElementById('archFlex').value,
    pressureDist: document.getElementById('pressureDist').value,
    instepHeight: document.getElementById('instepHeight').value,
    ballWidth: document.getElementById('ballWidth').value,
  };

  const cats = new Set();
  scanRules.forEach(rule => {
    if (inputs[rule.field] === rule.value) cats.add(rule.category);
  });
  return Array.from(cats);
}

runScan.addEventListener('click', () => {
  const inferred = inferCategoriesFromScan();
  if (!inferred.length) {
    alert('Select at least arch height, arch flex, pressure distribution, or ball/instep width to get a match.');
    return;
  }
  scanCategories = inferred;
  categorySelect.value = '';
  searchBox.value = '';
  activateTab('browse');
  scanBanner.style.display = 'flex';
  scanBanner.innerHTML = `<span>Showing matches for: <strong>${inferred.join(', ')}</strong></span>`;
  render();
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn secondary';
  clearBtn.textContent = 'Clear scan';
  clearBtn.style.padding = '4px 10px';
  clearBtn.style.fontSize = '12px';
  clearBtn.addEventListener('click', () => {
    scanCategories = null;
    scanBanner.style.display = 'none';
    clearScanInputs();
    render();
  });
  scanBanner.appendChild(clearBtn);
});

// ---------------------------------------------------------------------------
// Insert finder
// ---------------------------------------------------------------------------

const insertTriggersEl = document.getElementById('insertTriggers');
const runInsert = document.getElementById('runInsert');
const insertOutput = document.getElementById('insertOutput');

function renderInsertTriggerChecks() {
  insertTriggersEl.innerHTML = '';
  insertTriggers.forEach(t => {
    const label = document.createElement('label');
    label.className = 'cat-check';
    label.innerHTML = `<input type="checkbox" value="${t.key}"> ${t.label}`;
    insertTriggersEl.appendChild(label);
  });
}

document.getElementById('cancelInsert').addEventListener('click', () => {
  activateTab('browse');
});

runInsert.addEventListener('click', () => {
  const archHeight = document.getElementById('insertArchHeight').value;
  const checked = Array.from(insertTriggersEl.querySelectorAll('input:checked')).map(i => i.value);

  let html = '';

  if (archHeight && archColorMap[archHeight]) {
    const colors = archColorMap[archHeight];
    html += `<div class="insert-result"><h4>Arch height reference: ${archHeight}</h4>
      <p><span class="swatch" style="background:${colors.curex_hex}"></span>Curex: ${colors.curex_label}
      &nbsp;&nbsp; Superfeet: ${colors.superfeet_label}</p></div>`;
  }

  const matches = insertTriggers.filter(t => checked.includes(t.key));
  if (!matches.length && !archHeight) {
    insertOutput.innerHTML = '<p style="font-size:13px; color:var(--ink-soft);">Select an arch height and/or any situational notes that apply, then click Recommend insert.</p>';
    return;
  }

  const grouped = {};
  matches.forEach(m => {
    if (!grouped[m.insert_name]) grouped[m.insert_name] = [];
    grouped[m.insert_name].push(m.why);
  });

  Object.keys(grouped).forEach(insertName => {
    html += `<div class="insert-result"><h4>${insertName}</h4>
      <p class="why">${grouped[insertName].join(' ')}</p></div>`;
  });

  insertOutput.innerHTML = html;
});

// ---------------------------------------------------------------------------
// Manage rules panel (scan_rules + insert_triggers, staff-editable)
// ---------------------------------------------------------------------------

const scanRulesTableEl = document.getElementById('scanRulesTable');
const insertTriggersTableEl = document.getElementById('insertTriggersTable');
const newRuleCategorySelect = document.getElementById('newRuleCategory');

const FIELD_LABELS = {
  archHeight: 'Arch height',
  archFlex: 'Arch flex',
  pressureDist: 'Pressure distribution',
  instepHeight: 'Instep height',
  ballWidth: 'Ball width',
};

function renderScanRulesTable() {
  const rows = scanRules.map(r => `
    <tr>
      <td>${FIELD_LABELS[r.field] || r.field}</td>
      <td>${r.value}</td>
      <td>${r.category}</td>
      <td><button class="btn danger" data-delete-rule="${r.id}">Remove</button></td>
    </tr>
  `).join('');
  scanRulesTableEl.innerHTML = `
    <table class="rules-table">
      <thead><tr><th>Scan field</th><th>Value</th><th>Implies category</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4">No rules yet.</td></tr>'}</tbody>
    </table>
  `;
  scanRulesTableEl.querySelectorAll('[data-delete-rule]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteRule;
      const { error } = await supabase.from('scan_rules').delete().eq('id', id);
      if (error) { alert('Could not remove rule: ' + error.message); return; }
      scanRules = scanRules.filter(r => r.id !== id);
      renderScanRulesTable();
    });
  });
}

function renderInsertTriggersTable() {
  const rows = insertTriggers.map(t => `
    <tr>
      <td>${t.label}</td>
      <td>${t.insert_name}</td>
      <td style="max-width:260px;">${t.why}</td>
      <td><button class="btn danger" data-delete-trigger="${t.id}">Remove</button></td>
    </tr>
  `).join('');
  insertTriggersTableEl.innerHTML = `
    <table class="rules-table">
      <thead><tr><th>Situational note</th><th>Recommended insert</th><th>Why</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4">No triggers yet.</td></tr>'}</tbody>
    </table>
  `;
  insertTriggersTableEl.querySelectorAll('[data-delete-trigger]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteTrigger;
      const { error } = await supabase.from('insert_triggers').delete().eq('id', id);
      if (error) { alert('Could not remove trigger: ' + error.message); return; }
      insertTriggers = insertTriggers.filter(t => t.id !== id);
      renderInsertTriggersTable();
      renderInsertTriggerChecks();
    });
  });
}

function renderNewRuleCategoryOptions() {
  newRuleCategorySelect.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

document.getElementById('addRuleBtn').addEventListener('click', async () => {
  const field = document.getElementById('newRuleField').value;
  const value = document.getElementById('newRuleValue').value.trim();
  const category = newRuleCategorySelect.value;
  if (!value || !category) { alert('Enter a value and pick a category.'); return; }

  const { data, error } = await supabase
    .from('scan_rules')
    .insert({ field, value, category, sort_order: scanRules.length })
    .select()
    .single();
  if (error) { alert('Could not add rule: ' + error.message); return; }
  scanRules.push(data);
  renderScanRulesTable();
  document.getElementById('newRuleValue').value = '';
});

document.getElementById('addTriggerBtn').addEventListener('click', async () => {
  const key = document.getElementById('newTriggerKey').value.trim();
  const label = document.getElementById('newTriggerLabel').value.trim();
  const insert_name = document.getElementById('newTriggerInsert').value.trim();
  const why = document.getElementById('newTriggerWhy').value.trim();
  if (!key || !label || !insert_name || !why) { alert('Fill in all four fields.'); return; }

  const { data, error } = await supabase
    .from('insert_triggers')
    .insert({ key, label, insert_name, why, sort_order: insertTriggers.length })
    .select()
    .single();
  if (error) { alert('Could not add trigger: ' + error.message); return; }
  insertTriggers.push(data);
  renderInsertTriggersTable();
  renderInsertTriggerChecks();
  ['newTriggerKey', 'newTriggerLabel', 'newTriggerInsert', 'newTriggerWhy'].forEach(id => {
    document.getElementById(id).value = '';
  });
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function boot() {
  await loadAll();
  populateCategorySelect();
  renderNewCats();
  renderInsertTriggerChecks();
  renderScanRulesTable();
  renderInsertTriggersTable();
  renderNewRuleCategoryOptions();
  render();
}

boot();
