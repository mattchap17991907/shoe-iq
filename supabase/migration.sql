-- Shoe IQ v2 migration
-- Run once in the Supabase SQL editor after the original schema.sql has been applied.

-- ── Expand shoes table with multi-dimensional taxonomy ───────────────────────

ALTER TABLE shoes
  ADD COLUMN IF NOT EXISTS use_case        text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cushion_level   text,
  ADD COLUMN IF NOT EXISTS stability_level text,
  ADD COLUMN IF NOT EXISTS width_options   text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS heel_drop       text,
  ADD COLUMN IF NOT EXISTS fit_volume      text,
  ADD COLUMN IF NOT EXISTS education_tip   text;

-- ── Pain-point → insert mapping ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pain_point_inserts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pain_point_key   text UNIQUE NOT NULL,
  pain_point_label text NOT NULL,
  insert_name      text NOT NULL,
  why              text NOT NULL,
  education_tip    text,
  sort_order       int  NOT NULL DEFAULT 0
);

ALTER TABLE pain_point_inserts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pain_point_inserts' AND policyname='anon read pain_point_inserts') THEN
    CREATE POLICY "anon read pain_point_inserts" ON pain_point_inserts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pain_point_inserts' AND policyname='anon write pain_point_inserts') THEN
    CREATE POLICY "anon write pain_point_inserts" ON pain_point_inserts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO pain_point_inserts (pain_point_key, pain_point_label, insert_name, why, education_tip, sort_order) VALUES
  ('plantar_fasciitis',  'Plantar fasciitis',               'Superfeet PF (orange)',
   'Rigid heel cup + arch support targets the fascia under load.',
   'The plantar fascia runs heel to ball. A firm heel cup controls rearfoot motion and unloads the band at toe-off — when PF pain peaks.',
   0),
  ('metatarsalgia',      'Metatarsalgia / ball-of-foot pain', 'Currex RunPro',
   'Metatarsal pad redistributes pressure away from the met heads.',
   'A metatarsal pad placed just behind the heads offloads the pressure point and reduces friction at the ball of foot.',
   1),
  ('achilles_pain',      'Achilles tendonitis / tightness', 'Superfeet Dynamic',
   'Heel lift reduces Achilles load at push-off; arch support minimizes overpronation-driven strain.',
   'The Achilles is strained most at push-off. A modest heel lift shortens its working range; an arch insert reduces the inward roll that torques the tendon.',
   2),
  ('shin_splints',       'Shin splints / MTSS',             'Superfeet Support',
   'Medial arch support reduces excessive tibial rotation.',
   'MTSS (shin splints) comes from overloading the tibialis posterior. A structured arch insert offloads that muscle and limits the collapse that stresses the tibia.',
   3),
  ('knee_pain',          'Knee pain / IT band tightness',   'Superfeet Dynamic',
   'Corrects foot posture upstream, reducing valgus knee loading.',
   'Overpronation causes the tibia to internally rotate, pulling the IT band across the lateral femoral condyle. An arch insert corrects the chain at the foot.',
   4),
  ('heel_pain',          'Heel pain / bruised heel',        'Superfeet PF (orange)',
   'Reinforced heel cup cushions impact and protects the fat pad.',
   'The heel fat pad absorbs up to 110% of body weight at landing. A deep heel cup centralizes and compresses the pad, preventing it from splaying.',
   5),
  ('bunions',            'Bunions / hallux valgus',         'Currex RunPro',
   'Low-profile, flexible design avoids pressure on the first MTP joint.',
   'Bunions create a bony prominence at the first MTP joint. A low-volume insert avoids adding pressure there while still giving arch support.',
   6),
  ('neuropathy_diabetes','Neuropathy / diabetes',           'Superfeet DMP (grey)',
   'Memory foam top coat protects sensitive feet and reduces shear forces.',
   'Neuropathy reduces sensation, so pressure points go unnoticed until they become ulcers. A cushioned full-contact insert distributes load and reduces shear to protect vulnerable tissue.',
   7)
ON CONFLICT (pain_point_key) DO NOTHING;

-- ── Contextual education tips ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS education_tips (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context    text UNIQUE NOT NULL,
  tip        text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

ALTER TABLE education_tips ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='education_tips' AND policyname='anon read education_tips') THEN
    CREATE POLICY "anon read education_tips" ON education_tips FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='education_tips' AND policyname='anon write education_tips') THEN
    CREATE POLICY "anon write education_tips" ON education_tips FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO education_tips (context, tip, sort_order) VALUES
  ('stability_neutral',   'Neutral shoes work best for biomechanically efficient runners with no overpronation — look for underpronators or people with rigid, high arches.', 0),
  ('stability_guidance',  'Guidance / mild stability shoes (GuideRails, sidewalls) guide the foot through its natural motion without over-correcting. Great for slight overpronation or first-time stability buyers.', 1),
  ('stability_structured','High-structure shoes are for significant overpronation or very flexible arches. Key cue: the arch nearly touches the ground on the wet-foot test.', 2),
  ('cushion_low',         'Low-cushion shoes promote proprioception and are preferred by minimalist runners. Always check calf flexibility — low drop + low cushion = high Achilles demand.', 3),
  ('cushion_medium',      'Medium cushion is the daily trainer sweet spot — enough protection for mileage without the weight penalty of a max shoe.', 4),
  ('cushion_high',        'Max cushion reduces cumulative load for high-mileage runners, concrete workers, and people with fat-pad atrophy. Great cross-sell with a PF insert.', 5),
  ('insert_arch_low',     'Low arches need a structured post under the arch to control collapse. Superfeet Support or DMP. Cue on Volumental: arch height bar at the bottom.', 6),
  ('insert_arch_medium',  'Medium arches are the most common. A semi-rigid insert (Superfeet Dynamic, Currex RunPro) gives support without over-correcting.', 7),
  ('insert_arch_high',    'High arches are rigid and don''t absorb shock well — they need a cushioned, high-volume insert. Goal: fill the void and add shock absorption.', 8),
  ('scan_pressure_medial','Medial pressure means the customer loads the inside edge — a sign of overpronation. Pair with a stability shoe and structured arch insert.', 9),
  ('scan_pressure_lateral','Lateral pressure means loading the outside edge — supination. They need a neutral, flexible, well-cushioned shoe that won''t over-correct.', 10),
  ('scan_arch_rigid',     'Rigid arch flex on the Volumental means the foot doesn''t flatten under load — a locked arch. These feet need cushion and shock absorption more than support.', 11),
  ('scan_arch_flexible',  'Flexible arch flex means the arch collapses significantly under load, driving overpronation. Stability shoe + structured insert is almost always the right answer.', 12)
ON CONFLICT (context) DO NOTHING;
