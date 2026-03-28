-- ============================================================
-- Collie ROI Calculator - Supabase Setup
-- Run this in your Supabase SQL Editor (supabase.com > project > SQL Editor)
-- ============================================================

-- 1. Leads table
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  naam text,
  email text,
  bedrijfsnaam text,
  telefoon text,
  provincie text,
  aantal_koeien integer,
  hectares decimal,
  uren_nu integer,
  dagen_nu integer,
  melkrobot boolean
);

-- 2. Berekeningen table
CREATE TABLE berekeningen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  lead_id uuid REFERENCES leads(id),
  stap text,
  netto_rendement decimal,
  bruto_baten decimal,
  collar_kosten decimal,
  arbeid_besparing decimal,
  krachtvoer_besparing decimal,
  kuilvoer_besparing decimal,
  strooisel_besparing decimal,
  mest_besparing decimal,
  extra_melk decimal,
  form_data jsonb
);

-- 3. Scenarios table (for future admin panel)
CREATE TABLE scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  scenario_type text,
  weidedagen_collie integer,
  uren_collie integer,
  arbeid_beweiding_collie_weide decimal,
  arbeid_stal_collie_weide decimal,
  melkproductie integer,
  melkproductie_collie integer,
  melkingen_nu_melkstal decimal,
  melkingen_nu_robot decimal,
  melkingen_collie_melkstal decimal,
  melkingen_collie_robot decimal,
  arbeid_beweiding_nu_weide decimal,
  arbeid_stal_nu_weide decimal,
  arbeid_stal_nu_stal decimal,
  krachtvoer_opname_nu_weide decimal,
  bijproducten_opname_nu_weide decimal,
  maiskuil_opname_nu_weide decimal,
  krachtvoer_opname_collie_weide decimal,
  bijproducten_opname_collie_weide decimal,
  maiskuil_opname_collie_weide decimal,
  graskuil_opname_nu_stal decimal,
  krachtvoer_opname_nu_stal decimal,
  bijproducten_opname_nu_stal decimal,
  maiskuil_opname_nu_stal decimal,
  melkprijs decimal,
  krachtvoer_prijs decimal,
  bijproducten_prijs decimal,
  strooisel_kosten decimal,
  mestuitrijden_kosten decimal,
  arbeid_waarde decimal
);

-- 4. Seed scenario data
INSERT INTO scenarios (name, scenario_type, weidedagen_collie, uren_collie, arbeid_beweiding_collie_weide, arbeid_stal_collie_weide, melkproductie, melkproductie_collie, melkprijs, krachtvoer_prijs, bijproducten_prijs, arbeid_beweiding_nu_weide, arbeid_stal_nu_weide, arbeid_stal_nu_stal, krachtvoer_opname_nu_weide, bijproducten_opname_nu_weide, maiskuil_opname_nu_weide, krachtvoer_opname_collie_weide, bijproducten_opname_collie_weide, maiskuil_opname_collie_weide, graskuil_opname_nu_stal, krachtvoer_opname_nu_stal, bijproducten_opname_nu_stal, maiskuil_opname_nu_stal, strooisel_kosten, mestuitrijden_kosten, arbeid_waarde, melkingen_nu_melkstal, melkingen_nu_robot, melkingen_collie_melkstal, melkingen_collie_robot)
VALUES
  ('Conservatief', 'conservatief', 180, 2000, 0.20, 0.5, 9000, 9000, 0.40, 0.35, 0.25, 1, 1, 2, 5, 0, 0, 5, 0, 0, 15, 5, 0, 0, 5, 3, 35, 2, 2.3, 2, 2.3),
  ('Gemiddeld', 'gemiddeld', 200, 2500, 0.15, 0.5, 9000, 9000, 0.45, 0.35, 0.25, 1, 1, 2, 5, 0, 0, 4, 0, 0, 15, 5, 0, 0, 5, 3, 35, 2, 2.3, 2, 2.3),
  ('Optimistisch', 'optimistisch', 220, 3000, 0.10, 0.5, 9000, 9000, 0.50, 0.35, 0.25, 1, 1, 2, 5, 0, 0, 3, 0, 0, 15, 5, 0, 0, 5, 3, 35, 2, 2.3, 2, 2.3);

-- 5. Enable Row Level Security (allow anonymous inserts for leads/berekeningen)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE berekeningen ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert leads and berekeningen
CREATE POLICY "Allow anonymous insert leads" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous insert berekeningen" ON berekeningen FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous users to read scenarios
CREATE POLICY "Allow anonymous read scenarios" ON scenarios FOR SELECT TO anon USING (true);
