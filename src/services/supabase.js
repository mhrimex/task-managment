import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase Dashboard -> Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kmlhipcavrhhemwyipdt.supabase.co';
// IMPORTANT: Replace the string below with your actual "anon public" key from Supabase
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbGhpcGNhdnJoaGVtd3lpcGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NDY2NDQsImV4cCI6MjA5MzEyMjY0NH0.mQQnqruCHvH1VF4NWRdG884WaGy4gF9R5N4E3MZf4mk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug Proxy to catch that elusive POST to /roles
if (import.meta.env.MODE === 'production' || true) {
  const originalFrom = supabase.from;
  supabase.from = function(table) {
    const fromObj = originalFrom.apply(this, arguments);
    ['insert', 'upsert', 'update', 'delete', 'select'].forEach(method => {
      const originalMethod = fromObj[method];
      fromObj[method] = function() {
        console.log(`[Supabase Debug] ${method.toUpperCase()} on ${table}`, arguments);
        if (table === 'roles' && method === 'insert') {
          console.trace('Who called roles.insert?');
        }
        return originalMethod.apply(this, arguments);
      };
    });
    return fromObj;
  };
}
