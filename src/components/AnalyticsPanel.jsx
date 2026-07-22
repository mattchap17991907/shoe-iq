import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function BarList({ title, rows, maxCount }) {
  if (!rows.length) return (
    <div className="analytics-section">
      <h4>{title}</h4>
      <p className="analytics-empty">No data yet — run some scans to populate this.</p>
    </div>
  );
  return (
    <div className="analytics-section">
      <h4>{title}</h4>
      <div className="bar-list">
        {rows.map(([label, count]) => (
          <div key={label} className="bar-row">
            <span className="bar-label">{label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${Math.round((count / maxCount) * 100)}%` }} />
            </div>
            <span className="bar-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ activeStore }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEvents(); }, [activeStore]);

  async function loadEvents() {
    setLoading(true);
    const query = supabase
      .from('analytics_events')
      .select('*')
      .eq('event_type', 'scan_completed')
      .order('created_at', { ascending: false });
    if (activeStore) query.eq('store_id', activeStore.id);
    const { data } = await query;
    setEvents(data || []);
    setLoading(false);
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = events.filter(e => new Date(e.created_at) > weekAgo).length;

  const tagCounts = {};
  events.forEach(e => {
    (e.event_data?.categories || []).forEach(cat => {
      tagCounts[cat] = (tagCounts[cat] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const shoeCounts = {};
  events.forEach(e => {
    (e.event_data?.matched_shoes || []).forEach(shoe => {
      shoeCounts[shoe] = (shoeCounts[shoe] || 0) + 1;
    });
  });
  const topShoes = Object.entries(shoeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const cushionCounts = events.reduce((acc, e) => {
    const c = e.event_data?.cushion;
    if (c) acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const topCushion = Object.entries(cushionCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="bar" />
        <h3>Analytics</h3>
        {activeStore && <span className="store-tag">{activeStore.city}, {activeStore.state}</span>}
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '40px 0' }}>Loading analytics…</div>
      ) : (
        <>
          <div className="stat-row">
            <StatCard
              label="Total scans"
              value={events.length}
              sub="all time"
            />
            <StatCard
              label="This week"
              value={thisWeek}
              sub="last 7 days"
            />
            <StatCard
              label="Top cushion need"
              value={topCushion ? topCushion[0].charAt(0).toUpperCase() + topCushion[0].slice(1) : '—'}
              sub={topCushion ? `${topCushion[1]} scan${topCushion[1] === 1 ? '' : 's'}` : 'no data yet'}
            />
          </div>

          <BarList
            title="Top customer profile tags"
            rows={topTags}
            maxCount={topTags[0]?.[1] || 1}
          />

          <BarList
            title="Most matched shoes"
            rows={topShoes}
            maxCount={topShoes[0]?.[1] || 1}
          />

          {events.length === 0 && (
            <p className="analytics-empty" style={{ textAlign: 'center', marginTop: 8 }}>
              Run your first scan to start seeing data here.
            </p>
          )}
        </>
      )}
    </div>
  );
}
