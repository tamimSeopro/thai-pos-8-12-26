/**
 * Supabase Free Tier Integration Helper & RLS Security Schema Generator
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
}

const SUPABASE_CONFIG_KEY = 'thai_pos_supabase_config';

export const DEFAULT_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://yowcmycyukdvboohtqgq.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_znJ_zF0bzIiZkCUCFXbKbw_ucprsqTt';

export function getSupabaseConfig(): SupabaseConfig {
  const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.supabaseUrl && parsed.supabaseAnonKey) {
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return {
    supabaseUrl: DEFAULT_SUPABASE_URL,
    supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
    isConnected: Boolean(DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY),
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  if (config.supabaseUrl && config.supabaseAnonKey) {
    try {
      supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
      return supabaseInstance;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  }
  return null;
}


/**
 * Complete, free Supabase PostgreSQL Schema with Row Level Security (RLS) policies
 * to guarantee data isolation by store_id and role-based access.
 */
export function generateSupabaseRLSSQL(): string {
  return `-- ====================================================================
-- THAI GLASS POS - FREE SUPABASE POSTGRESQL SCHEMA WITH RLS SECURITY RULES
-- Multi-Tenant Store Data Isolation & Hashed Auth Policy Setup
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Stores Table
CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  admin_username TEXT NOT NULL UNIQUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Stores RLS Policies
-- Super admins can view/control all stores; Store admins can view their own store
CREATE POLICY "Super Admin Stores Full Control" ON stores
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Store Admin Store View" ON stores
  FOR SELECT
  USING (id = (auth.jwt() ->> 'store_id'));


-- 3. Users & Auth Metadata Table (linked to Supabase Auth UUID)
CREATE TABLE IF NOT EXISTS app_users (
  id VARCHAR(50) PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'store_admin', 'moderator')),
  store_id VARCHAR(50) REFERENCES stores(id) ON DELETE CASCADE,
  store_name TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  failed_login_attempts INT DEFAULT 0,
  lockout_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Users
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
CREATE POLICY "Super Admin Users Control" ON app_users
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Store Admin Staff Control" ON app_users
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'store_admin' AND store_id = (auth.jwt() ->> 'store_id')
  );

CREATE POLICY "User Self View" ON app_users
  FOR SELECT USING (id = auth.uid()::text);


-- 4. Products Table (Isolated by store_id)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('glass', 'thai', 'aluminum', 'accessories')),
  unit TEXT NOT NULL,
  stock_qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(12, 2) NOT NULL DEFAULT 0,
  buying_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  thickness_mm NUMERIC(5, 2),
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Product RLS Policies
CREATE POLICY "Store Data Isolation for Products" ON products
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    store_id = (auth.jwt() ->> 'store_id')
  );


-- 5. Invoices & Sales Table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  invoice_no TEXT NOT NULL,
  store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id VARCHAR(50),
  customer_name TEXT NOT NULL,
  customer_type TEXT NOT NULL,
  customer_mobile TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12, 2) NOT NULL,
  paid_amount NUMERIC(12, 2) NOT NULL,
  due_amount NUMERIC(12, 2) NOT NULL,
  payment_status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_name TEXT NOT NULL
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store Data Isolation for Invoices" ON invoices
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    store_id = (auth.jwt() ->> 'store_id')
  );


-- 6. Customers & Due Ledger Table
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  store_id VARCHAR(50) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT,
  total_due NUMERIC(12, 2) DEFAULT 0
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store Data Isolation for Customers" ON customers
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'super_admin' OR
    store_id = (auth.jwt() ->> 'store_id')
  );

-- ====================================================================
-- SUCCESS: Free Supabase Schema initialized with full RLS Protection!
-- ====================================================================
`;
}
