import { createClient } from "@supabase/supabase-js";

// --- SUPABASE CONFIGURATION ---
// Replace the values below with your specific project details from the Supabase Dashboard.

export const SUPABASE_URL = "https://ecnjojzmkehjaoglbsxf.supabase.co";
export const SUPABASE_PUBLIC_KEY = "sb_publishable_uv_fnoBXouTrrdJtuT6K5Q_3wuOyxv-";

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
