import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase Dashboard -> Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kmlhipcavrhhemwyipdt.supabase.co';
// IMPORTANT: Replace the string below with your actual "anon public" key from Supabase
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbGhpcGNhdnJoaGVtd3lpcGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NDY2NDQsImV4cCI6MjA5MzEyMjY0NH0.mQQnqruCHvH1VF4NWRdG884WaGy4gF9R5N4E3MZf4mk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
