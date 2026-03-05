import { createClient } from '@supabase/supabase-js';

// [FRONTEND CLIENT] ใช้สำหรับเชื่อมต่อจาก Browser (React) เท่านั้น
// ตรวจสอบค่า Environment Variables ของ Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your frontend/.env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
