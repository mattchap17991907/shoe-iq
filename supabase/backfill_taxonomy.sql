-- ══════════════════════════════════════════════════════════════════════════════
-- Shoe IQ v2 — Taxonomy backfill for existing 67 shoes
-- Paste the entire file into the Supabase SQL editor and click Run.
-- Safe to re-run: every statement only touches null / empty values.
-- ══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. cushion_level
--    Runs in priority order: 'high' first so Ghost Max (High Coushin + Firm Coushin)
--    gets 'high', not 'low'. Race Day / XC shoes without an explicit cushion tag
--    are intentionally left null — they vary too much (Superblast = high,
--    Metaspeed = low). Fill those 9 manually in the table editor.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE shoes SET cushion_level = 'high'
WHERE cushion_level IS NULL
  AND categories && ARRAY['High Coushin', 'Soft Coushin']::text[];

UPDATE shoes SET cushion_level = 'low'
WHERE cushion_level IS NULL
  AND categories && ARRAY['Low Coushin', 'Firm Coushin']::text[];

UPDATE shoes SET cushion_level = 'medium'
WHERE cushion_level IS NULL
  AND categories && ARRAY[
    'Neutral', 'Supportive', 'Plantar Fascitis', 'Cross Trainer',
    'Beginner Runners', 'Concrete/Long Hours',
    'Older People / Dr. Recs', 'Neuropathy/ Diabetes',
    'Narrow/ Low Instep fit', 'Wide/ High Instep fit'
  ]::text[];


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. stability_level
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE shoes SET stability_level = 'structured'
WHERE stability_level IS NULL
  AND categories && ARRAY['Supportive', 'Plantar Fascitis']::text[];

UPDATE shoes SET stability_level = 'neutral'
WHERE stability_level IS NULL
  AND categories @> ARRAY['Neutral']::text[]
  AND NOT categories && ARRAY['Supportive', 'Plantar Fascitis']::text[];

-- Cross trainers with no explicit stability tag → mild 'guidance'
UPDATE shoes SET stability_level = 'guidance'
WHERE stability_level IS NULL
  AND categories @> ARRAY['Cross Trainer']::text[];

-- Speed / XC shoes default to neutral
UPDATE shoes SET stability_level = 'neutral'
WHERE stability_level IS NULL
  AND categories && ARRAY['Race Day Shoes', 'Cross Country Runners']::text[];


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. use_case  (multi-value text[])
--    Builds the array in a single pass from category overlaps.
--    Only 'Neuropathy/ Diabetes' and 'Older People / Dr. Recs' alone don't trigger
--    road_running — those shoes (Altra, Topo stubs) are walking/medical only.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE shoes
SET use_case = (
  SELECT COALESCE(array_agg(DISTINCT uc), ARRAY[]::text[])
  FROM (
    -- Any shoe with a running, training, or fit-width category is a road shoe
    SELECT 'road_running'::text AS uc
    WHERE categories && ARRAY[
      'Beginner Runners', 'Cross Trainer', 'Race Day Shoes', 'Cross Country Runners',
      'High Coushin', 'Low Coushin', 'Soft Coushin', 'Firm Coushin',
      'Neutral', 'Supportive', 'Plantar Fascitis',
      'Concrete/Long Hours', 'Narrow/ Low Instep fit', 'Wide/ High Instep fit'
    ]::text[]

    UNION ALL

    -- Cross country / track tagged shoes also appear in Track & XC filter
    SELECT 'track_xc'
    WHERE categories && ARRAY['Cross Country Runners']::text[]

    UNION ALL

    -- Walking, concrete, medical-use shoes
    SELECT 'walking_workplace'
    WHERE categories && ARRAY[
      'Concrete/Long Hours', 'Older People / Dr. Recs', 'Neuropathy/ Diabetes'
    ]::text[]
  ) t
)
WHERE use_case = '{}' OR use_case IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. width_options  (multi-value text[])
--    All shoes default to 'standard'; tagged shoes get wide / narrow appended.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE shoes SET width_options = ARRAY['standard']::text[]
WHERE array_length(width_options, 1) IS NULL OR width_options = '{}';

UPDATE shoes SET width_options = array_append(width_options, 'wide')
WHERE categories @> ARRAY['Wide/ High Instep fit']::text[]
  AND NOT width_options @> ARRAY['wide']::text[];

UPDATE shoes SET width_options = array_append(width_options, 'narrow')
WHERE categories @> ARRAY['Narrow/ Low Instep fit']::text[]
  AND NOT width_options @> ARRAY['narrow']::text[];
