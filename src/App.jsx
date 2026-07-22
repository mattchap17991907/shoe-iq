import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient.js';
import { isPinUnlocked } from './lib/pin.js';
import { logEvent } from './lib/analytics.js';
import Nav from './components/Nav.jsx';
import PinModal from './components/PinModal.jsx';
import ConsultationChecklist from './components/ConsultationChecklist.jsx';
import ScanPanel from './components/ScanPanel.jsx';
import BrowsePanel from './components/BrowsePanel.jsx';
import InsertFinder from './components/InsertFinder.jsx';
import AddShoePanel from './components/AddShoePanel.jsx';
import ManageRules from './components/ManageRules.jsx';
import AnalyticsPanel from './components/AnalyticsPanel.jsx';

const PIN_GATED = new Set(['add', 'manage', 'analytics']);

export default function App() {
  const [shoes, setShoes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [scanRules, setScanRules] = useState([]);
  const [insertTriggers, setInsertTriggers] = useState([]);
  const [archColorMap, setArchColorMap] = useState({});
  const [painPointInserts, setPainPointInserts] = useState([]);
  const [educationTips, setEducationTips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeStore, setActiveStore] = useState(null);
  const [storeNotes, setStoreNotes] = useState({});
  const [appUnlocked, setAppUnlocked] = useState(isPinUnlocked());
  const [activeTab, setActiveTab] = useState('browse');
  const [scanProfile, setScanProfile] = useState(null);
  const [pinModal, setPinModal] = useState(null); // null | { resolve: fn }

  useEffect(() => { if (appUnlocked) loadAll(); }, [appUnlocked]);

  async function loadAll() {
    setLoading(true);
    const [catRes, shoeRes, ruleRes, triggerRes, colorRes, painRes, tipRes, storeRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('shoes').select('*').order('display'),
      supabase.from('scan_rules').select('*').order('sort_order'),
      supabase.from('insert_triggers').select('*').order('sort_order'),
      supabase.from('arch_color_map').select('*'),
      supabase.from('pain_point_inserts').select('*').order('sort_order'),
      supabase.from('education_tips').select('*').order('sort_order'),
      supabase.from('stores').select('*').eq('pin', import.meta.env.VITE_STAFF_PIN).maybeSingle(),
    ]);

    setCategories(catRes.data || []);
    setShoes(shoeRes.data || []);
    setScanRules(ruleRes.data || []);
    setInsertTriggers(triggerRes.data || []);
    const colorMap = {};
    (colorRes.data || []).forEach(row => { colorMap[row.arch_height] = row; });
    setArchColorMap(colorMap);
    setPainPointInserts(painRes.data || []);
    setEducationTips(tipRes.data || []);
    const store = storeRes.data || null;
    setActiveStore(store);

    if (store) {
      const { data: notesData } = await supabase
        .from('shoe_feature_notes')
        .select('shoe_id, notes')
        .eq('store_id', store.id);
      const map = {};
      (notesData || []).forEach(row => { map[row.shoe_id] = row.notes; });
      setStoreNotes(map);
    }

    setLoading(false);
  }

  function requirePin() {
    if (isPinUnlocked()) return Promise.resolve(true);
    return new Promise(resolve => setPinModal({ resolve }));
  }

  async function handleTabClick(tabName) {
    if (PIN_GATED.has(tabName)) {
      const ok = await requirePin();
      if (!ok) return;
    }
    setActiveTab(tabName);
  }

  function handlePinResult(ok) {
    if (pinModal) { pinModal.resolve(ok); setPinModal(null); }
  }

  function handleScanComplete(profile) {
    setScanProfile(profile);
    setActiveTab('browse');
    const matchedShoes = shoes
      .filter(s => s.in_store !== false)
      .filter(s => (s.categories || []).some(c => profile.categories.includes(c)))
      .map(s => s.display);
    logEvent(activeStore?.id, 'scan_completed', {
      categories: profile.categories,
      cushion: profile.cushion,
      stability: profile.stability,
      matched_shoe_count: matchedShoes.length,
      matched_shoes: matchedShoes,
    });
  }

  function handleAddShoe(shoe) {
    setShoes(prev => [...prev, shoe].sort((a, b) => a.display.localeCompare(b.display)));
    setActiveTab('browse');
  }

  if (!appUnlocked) {
    return (
      <div className="wrap">
        <header>
          <div className="brand">
            <h1>Shoe IQ</h1>
            <p>Fleet Feet staff finder</p>
          </div>
        </header>
        <div className="lane" />
        <PinModal appLevel onResult={ok => { if (ok) setAppUnlocked(true); }} />
      </div>
    );
  }

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <h1>Shoe IQ</h1>
          <p>Fleet Feet staff finder</p>
        </div>
        {activeStore && (
          <div className="store-banner">
            <span className="store-name">{activeStore.name} — {activeStore.city}, {activeStore.state}</span>
            <span className="store-beta">Multi-store β</span>
          </div>
        )}
      </header>
      <div className="lane" />

      <Nav activeTab={activeTab} onTabClick={handleTabClick} />

      {loading ? (
        <div className="loading">Loading shoe database…</div>
      ) : (
        <>
          {activeTab === 'checklist' && <ConsultationChecklist />}

          {activeTab === 'scan' && (
            <ScanPanel
              scanRules={scanRules}
              educationTips={educationTips}
              onScanComplete={handleScanComplete}
              onCancel={() => setActiveTab('browse')}
            />
          )}

          {activeTab === 'browse' && (
            <BrowsePanel
              shoes={shoes}
              categories={categories}
              scanProfile={scanProfile}
              educationTips={educationTips}
              storeNotes={storeNotes}
              onClearScan={() => setScanProfile(null)}
              onGoToScan={() => setActiveTab('scan')}
            />
          )}

          {activeTab === 'insert' && (
            <InsertFinder
              insertTriggers={insertTriggers}
              archColorMap={archColorMap}
              painPointInserts={painPointInserts}
              educationTips={educationTips}
              onCancel={() => setActiveTab('browse')}
            />
          )}

          {activeTab === 'add' && (
            <AddShoePanel
              categories={categories}
              onSave={handleAddShoe}
              onCancel={() => setActiveTab('browse')}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPanel activeStore={activeStore} />
          )}

          {activeTab === 'manage' && (
            <ManageRules
              shoes={shoes}
              setShoes={setShoes}
              activeStore={activeStore}
              storeNotes={storeNotes}
              setStoreNotes={setStoreNotes}
              scanRules={scanRules}
              setScanRules={setScanRules}
              insertTriggers={insertTriggers}
              setInsertTriggers={setInsertTriggers}
              painPointInserts={painPointInserts}
              setPainPointInserts={setPainPointInserts}
              categories={categories}
            />
          )}
        </>
      )}

      <footer>
        Synced live via Supabase — shared across every device at this store.
        {activeStore && <> · <strong>{activeStore.name} {activeStore.city}</strong></>}
      </footer>

      {pinModal && <PinModal onResult={handlePinResult} />}
    </div>
  );
}
