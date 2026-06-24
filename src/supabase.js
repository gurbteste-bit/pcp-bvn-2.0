import { createClient } from '@supabase/supabase-js'

// A anon key do Supabase é pública por design — fica exposta no bundle do navegador
// de qualquer forma. O acesso aos dados é protegido pelas políticas RLS no Supabase,
// não pelo segredo da chave. Embutir aqui elimina a dependência de env vars no Netlify.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tttutmwcyfwunvtazjtv.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0dHV0bXdjeWZ3dW52dGF6anR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTY2MDAsImV4cCI6MjA4ODA3MjYwMH0.r1ayAFm0H-ch6FFLNQb796dUuJA1i51xtM0qyHvR5Gk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
