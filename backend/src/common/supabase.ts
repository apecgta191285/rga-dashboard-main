import { createClient } from '@supabase/supabase-js';

// ใน Backend เราใช้ process.env แทน import.meta.env
const supabaseUrl = process.env.SUPABASE_URL;
// Backend มักจะใช้ Service Role Key เพื่อสิทธิ์ Admin (Bypass RLS)
// แต่ถ้าต้องการสิทธิ์จำกัดให้ใช้ Anon Key เหมือนเดิม
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in backend environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);