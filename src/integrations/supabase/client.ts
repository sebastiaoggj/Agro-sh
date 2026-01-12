import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qlvhiinpbniiqgyayrwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdmhpaW5wYm5paXFneWF5cndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTU0MTQsImV4cCI6MjA4Mzc5MTQxNH0.pbzithktNGBLLpEOhf1LQEKD-ctOvc1nro6kI2mTRUU';

export const supabase = createClient(supabaseUrl, supabaseKey);