import { supabase } from './supabaseClient.js';

export function logEvent(storeId, eventType, data = {}) {
  if (!storeId) return;
  supabase.from('analytics_events').insert({
    store_id: storeId,
    event_type: eventType,
    event_data: data,
  }).then(({ error }) => {
    if (error) console.warn('Analytics log failed:', error.message);
  });
}
