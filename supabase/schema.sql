-- Shoe IQ schema + seed data
-- Run this once in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int not null default 0
);

create table shoes (
  id uuid primary key default gen_random_uuid(),
  display text not null,
  brand text not null default '',
  categories text[] not null default '{}',
  specs text not null default '',
  flagged boolean not null default false,
  flag_reason text,
  created_at timestamptz not null default now()
);

-- One row per (field, value) -> category inferred from a Volumental scan reading.
-- Editable by a manager without touching app code.
create table scan_rules (
  id uuid primary key default gen_random_uuid(),
  field text not null,        -- 'archHeight' | 'archFlex' | 'pressureDist' | 'instepHeight' | 'ballWidth'
  value text not null,        -- e.g. 'High', 'Rigid', 'Medial'
  category text not null,     -- category name this combination implies
  sort_order int not null default 0
);

-- Insert Finder situational triggers (checkboxes) -> recommended insert + rationale.
create table insert_triggers (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  insert_name text not null,
  why text not null,
  sort_order int not null default 0
);

-- Arch height -> Curex / Superfeet color reference shown in the Insert Finder.
create table arch_color_map (
  arch_height text primary key,  -- 'Low' | 'Medium' | 'High'
  curex_label text not null,
  curex_hex text not null,
  superfeet_label text not null
);

-- ---------------------------------------------------------------------------
-- Row level security
-- Internal store tool: anyone with the publishable (anon) key can read/write.
-- The app additionally gates Add Shoe / Manage Rules behind a client-side PIN
-- (see src/pin.js) to keep a customer who picks up the tablet from editing data;
-- this is a deterrent, not real auth. If that's not enough, swap to Supabase Auth.
-- ---------------------------------------------------------------------------

alter table categories enable row level security;
alter table shoes enable row level security;
alter table scan_rules enable row level security;
alter table insert_triggers enable row level security;
alter table arch_color_map enable row level security;

create policy "anon read categories" on categories for select using (true);
create policy "anon write categories" on categories for all using (true) with check (true);

create policy "anon read shoes" on shoes for select using (true);
create policy "anon write shoes" on shoes for all using (true) with check (true);

create policy "anon read scan_rules" on scan_rules for select using (true);
create policy "anon write scan_rules" on scan_rules for all using (true) with check (true);

create policy "anon read insert_triggers" on insert_triggers for select using (true);
create policy "anon write insert_triggers" on insert_triggers for all using (true) with check (true);

create policy "anon read arch_color_map" on arch_color_map for select using (true);
create policy "anon write arch_color_map" on arch_color_map for all using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed: categories
-- ---------------------------------------------------------------------------

insert into categories (name, sort_order) values
  ('Cross Country Runners', 0),
  ('Concrete/Long Hours', 1),
  ('Plantar Fascitis', 2),
  ('Beginner Runners', 3),
  ('Narrow/ Low Instep fit', 4),
  ('Wide/ High Instep fit', 5),
  ('Cross Trainer', 6),
  ('Race Day Shoes', 7),
  ('Older People / Dr. Recs', 8),
  ('Neuropathy/ Diabetes', 9),
  ('Supportive', 10),
  ('Neutral', 11),
  ('High Coushin', 12),
  ('Low Coushin', 13),
  ('Soft Coushin', 14),
  ('Firm Coushin', 15);

-- ---------------------------------------------------------------------------
-- Seed: shoes
-- flagged = true where the spreadsheet gave a brand-only or ambiguous/typo'd
-- model name (no brand on file, or a near-duplicate of another row). Flagged
-- shoes show a small "needs review" badge in the UI; nothing else changes
-- until a fitter confirms the real model.
-- ---------------------------------------------------------------------------

insert into shoes (display, brand, categories, flagged, flag_reason) values
  ('1080', '', ARRAY['High Coushin','Neutral','Soft Coushin'], true, 'No brand on file'),
  ('860', '', ARRAY['Supportive'], true, 'No brand on file'),
  ('880', 'New Balance', ARRAY['Beginner Runners','Low Coushin','Neutral'], false, null),
  ('Adrenaline', '', ARRAY['Low Coushin'], true, 'No brand on file'),
  ('Adrenaline GTS', '', ARRAY['Supportive'], true, 'No brand on file'),
  ('Altra', '', ARRAY['Neuropathy/ Diabetes'], true, 'Looks like a brand name entered as the model'),
  ('Arahi', '', ARRAY['Low Coushin','Supportive'], true, 'No brand on file'),
  ('Asics', '', ARRAY['Narrow/ Low Instep fit'], true, 'Looks like a brand name entered as the model'),
  ('Atmos', 'Topo', ARRAY['High Coushin','Neutral','Wide/ High Instep fit'], false, null),
  ('Aura', '', ARRAY['High Coushin','Supportive'], true, 'No brand on file'),
  ('Bondi', 'Hoka', ARRAY['Concrete/Long Hours','High Coushin','Neutral'], false, null),
  ('Cellula', '', ARRAY['Neutral'], true, 'No brand on file'),
  ('Clifon', '', ARRAY['Neutral'], true, 'Possible typo/duplicate of "Clifton" (Hoka)'),
  ('Clifton', 'Hoka', ARRAY['Beginner Runners','Low Coushin'], false, null),
  ('Cloud 6', '', ARRAY['Low Coushin','Neutral'], true, 'No brand on file'),
  ('Cloud 6 or Cloud X', 'ON', ARRAY['Cross Trainer'], false, null),
  ('Cloud Monster', '', ARRAY['High Coushin','Neutral'], true, 'No brand on file'),
  ('Cloud Runner', '', ARRAY['Supportive'], true, 'No brand on file'),
  ('Cloud Surfer', '', ARRAY['Neutral'], true, 'No brand on file'),
  ('Cloud X', '', ARRAY['Low Coushin','Neutral'], true, 'No brand on file'),
  ('Cloudsurfer Max', '', ARRAY['High Coushin'], true, 'No brand on file'),
  ('Cumulus', '', ARRAY['Low Coushin','Neutral'], true, 'No brand on file'),
  ('Diadora', '', ARRAY['Narrow/ Low Instep fit'], true, 'Looks like a brand name entered as the model'),
  ('Echelon', 'Saucony', ARRAY['Neuropathy/ Diabetes','Older People / Dr. Recs','Supportive'], false, null),
  ('escalante', '', ARRAY['Low Coushin','Neutral'], true, 'No brand on file'),
  ('Evo SL', 'Adidas', ARRAY['Cross Country Runners'], false, null),
  ('flow', '', ARRAY['Neutral'], true, 'No brand on file'),
  ('Flow ST', '', ARRAY['Supportive'], true, 'No brand on file'),
  ('Fusion', '', ARRAY['Low Coushin','Neutral'], true, 'No brand on file'),
  ('FWD VIA', '', ARRAY['High Coushin'], true, 'No brand on file'),
  ('Gaviota', '', ARRAY['High Coushin','Supportive'], true, 'No brand on file'),
  ('Ghost', 'Brooks', ARRAY['Cross Trainer','Low Coushin','Neutral'], false, null),
  ('Ghost Max', 'Brooks', ARRAY['Concrete/Long Hours','Firm Coushin','High Coushin','Neutral','Older People / Dr. Recs','Wide/ High Instep fit'], false, null),
  ('Glycerin', '', ARRAY['High Coushin','Neutral','Soft Coushin'], true, 'No brand on file'),
  ('Glycerin Flex', '', ARRAY['High Coushin'], true, 'No brand on file'),
  ('Glycerin GTS', 'Brooks', ARRAY['Plantar Fascitis','Supportive'], false, null),
  ('GT-2000', 'Asics', ARRAY['Cross Trainer','Supportive'], false, null),
  ('Guide', '', ARRAY['Supportive'], true, 'No brand on file'),
  ('Horizon', 'Minzuno', ARRAY['Concrete/Long Hours','Plantar Fascitis','Supportive'], false, null),
  ('Ikoni', 'Karhu', ARRAY['Cross Trainer','Low Coushin','Supportive'], false, null),
  ('Inspire', '', ARRAY['Supportive'], true, 'No brand on file'),
  ('Karhu', '', ARRAY['Wide/ High Instep fit'], true, 'Looks like a brand name entered as the model'),
  ('Kayana', '', ARRAY['Supportive'], true, 'No brand on file'),
  ('Kayano', 'Asics', ARRAY['High Coushin','Plantar Fascitis'], false, null),
  ('Mach', 'Hoka', ARRAY['Cross Country Runners'], false, null),
  ('Maverick', 'TYR', ARRAY['Beginner Runners'], false, null),
  ('Megablast', 'Asics', ARRAY['Race Day Shoes'], false, null),
  ('Mestari', 'Karhu', ARRAY['Concrete/Long Hours','Firm Coushin','High Coushin','Neutral','Older People / Dr. Recs','Plantar Fascitis'], false, null),
  ('Metaspeed', 'Asics', ARRAY['Race Day Shoes'], false, null),
  ('Mizuno', '', ARRAY['Narrow/ Low Instep fit'], true, 'Looks like a brand name entered as the model'),
  ('Neo Zen', 'Mizuno', ARRAY['Cross Country Runners'], false, null),
  ('New Balance', '', ARRAY['Narrow/ Low Instep fit'], true, 'Looks like a brand name entered as the model'),
  ('Nimbus', 'Asics', ARRAY['Concrete/Long Hours','Cross Country Runners','High Coushin','Neutral','Soft Coushin'], false, null),
  ('Novablast', 'Asics', ARRAY['Cross Country Runners','High Coushin'], false, null),
  ('Nucleo', '', ARRAY['Neutral'], true, 'No brand on file'),
  ('Paradigm', '', ARRAY['High Coushin','Supportive'], true, 'No brand on file'),
  ('Phantom', '', ARRAY['Low Coushin','Neutral'], true, 'No brand on file'),
  ('Rebel', 'New Balance', ARRAY['Cross Country Runners'], false, null),
  ('Ride', '', ARRAY['Neutral'], true, 'No brand on file'),
  ('Rise', 'Adidas', ARRAY['Beginner Runners'], false, null),
  ('Speed wall shoes- all day race', '', ARRAY['Race Day Shoes'], true, 'Reads like a note rather than a model name'),
  ('Superblast', 'Asics', ARRAY['Race Day Shoes'], false, null),
  ('Supercompy Elite', 'New Balance', ARRAY['Race Day Shoes'], false, null),
  ('Topo', '', ARRAY['Neuropathy/ Diabetes'], true, 'Looks like a brand name entered as the model'),
  ('torrin', '', ARRAY['High Coushin','Neutral'], true, 'No brand on file'),
  ('Ultafly', '', ARRAY['Supportive'], true, 'Possible typo/duplicate of "Ultrafly"'),
  ('Ultrafly', '', ARRAY['Low Coushin'], true, 'Possible typo/duplicate of "Ultafly"; also no brand on file'),
  ('Vigore', '', ARRAY['Supportive'], true, 'No brand on file'),
  ('wave rider', '', ARRAY['Neutral'], true, 'No brand on file'),
  ('wave sky', '', ARRAY['Neutral'], true, 'No brand on file');

-- ---------------------------------------------------------------------------
-- Seed: scan_rules
-- Mirrors the original inferCategoriesFromScan() heuristic from the prototype.
-- This is Matt's own inference, not official Fleet Feet methodology -- a
-- manager should review/edit these rows before treating it as authoritative.
-- ---------------------------------------------------------------------------

insert into scan_rules (field, value, category, sort_order) values
  ('archHeight', 'High', 'Supportive', 0),
  ('archHeight', 'High', 'High Coushin', 1),
  ('archHeight', 'Low', 'Low Coushin', 2),
  ('archHeight', 'Low', 'Neutral', 3),
  ('archHeight', 'Medium', 'Neutral', 4),
  ('archFlex', 'Rigid', 'Supportive', 5),
  ('archFlex', 'Rigid', 'Firm Coushin', 6),
  ('archFlex', 'Flexible', 'Soft Coushin', 7),
  ('archFlex', 'Flexible', 'High Coushin', 8),
  ('archFlex', 'Moderate', 'Neutral', 9),
  ('pressureDist', 'Medial', 'Supportive', 10),
  ('pressureDist', 'Lateral', 'Neutral', 11),
  ('pressureDist', 'Lateral', 'Soft Coushin', 12),
  ('pressureDist', 'Centered', 'Neutral', 13),
  ('instepHeight', 'High', 'Wide/ High Instep fit', 14),
  ('instepHeight', 'Low', 'Narrow/ Low Instep fit', 15),
  ('ballWidth', 'Wide', 'Wide/ High Instep fit', 16),
  ('ballWidth', 'Narrow', 'Narrow/ Low Instep fit', 17);

-- ---------------------------------------------------------------------------
-- Seed: insert_triggers
-- Grounded in the staff notes (docx) and the handwritten rigidity ranking
-- (inserts.jpg). Still needs a fitter's sign-off before being treated as
-- authoritative -- flagged in the README, not in the data itself.
--
-- ME3D is split into two triggers per the docx ("SuperRev -- higher instep"
-- vs "SuperRev -- low instep, wants more cushion"), replacing the old single
-- generic "two different arches" trigger.
-- ---------------------------------------------------------------------------

insert into insert_triggers (key, label, insert_name, why, sort_order) values
  ('pronation_severe', 'Severe pronation', 'Superfeet Support', 'Severe pronation calls for maximum structure.', 0),
  ('flexible_severe', 'Super flexible feet', 'Superfeet Support', 'Very flexible feet need the most rigid support available.', 1),
  ('narrow_heel', 'Narrow heel', 'Superfeet Dynamic', 'Narrow heel fits well in the Dynamic shape.', 2),
  ('wants_structure', 'Wants more structure', 'Superfeet Dynamic', 'A step up in structure without going full Support.', 3),
  ('low_instep', 'Low instep', 'Superfeet Dynamic', 'Common pairing for a low instep fit.', 4),
  ('plantar_fasciitis', 'Plantar fasciitis', 'Superfeet PF (orange)', 'Built specifically for plantar fasciitis relief.', 5),
  ('heel_ankle_pain', 'Heel / ankle pain', 'Superfeet PF (orange)', 'Targets heel and ankle pain.', 6),
  ('dress_shoes', 'Needs to fit into dress shoes', 'Superfeet Women''s (pink)', 'Lower-volume shape fits dress shoes better.', 7),
  ('swelling', 'Swelling', 'Currex Run Pro', 'Most flexible/roomy option, good with swelling.', 8),
  ('zero_drop_runner', 'Runner, high instep, wants zero drop', 'Currex Run Pro', 'Matches runners wanting a zero-drop, flexible feel.', 9),
  ('pain_zero_drop', 'Pain complaints, high instep, wants zero drop', 'Currex Support STP', 'Adds support while keeping a zero-drop feel.', 10),
  ('me3d_high_instep', 'ME3D candidate -- higher instep', 'ME3D (SuperRev, high instep)', 'Custom-moldable SuperRev variant for a higher-instep fit.', 11),
  ('me3d_low_instep', 'ME3D candidate -- low instep, wants more cushion', 'ME3D (SuperRev, low instep)', 'Custom-moldable SuperRev variant for a low-instep fit that wants extra cushion.', 12),
  ('two_arches', 'Two different arches', 'ME3D', 'Custom-moldable to two different arch shapes -- always worth mentioning here.', 13),
  ('loves_nonplated', 'Loves non-plated shoes, wants plated feel', 'Carbon Plated Insert', 'Adds plate stiffness to a shoe that doesn''t have one.', 14),
  ('wide_wants_plate', 'Needs wide + wants a plate', 'Carbon Plated Insert', 'Plated insert option when the wide shoe itself isn''t plated.', 15);

-- ---------------------------------------------------------------------------
-- Seed: arch_color_map
-- ---------------------------------------------------------------------------

insert into arch_color_map (arch_height, curex_label, curex_hex, superfeet_label) values
  ('Low', 'Red', '#D8392B', 'Teal / Grey'),
  ('Medium', 'Yellow', '#F2C12E', 'Blue, Orange, or Pink'),
  ('High', 'Blue', '#2E6FBE', 'Red or Green');
