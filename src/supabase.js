import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Se as variáveis de ambiente não estiverem definidas (ex: Netlify sem as env vars configuradas),
// usa valores placeholder para que createClient não jogue erro imediato e trave o app.
// As chamadas à API vão falhar normalmente e o app carrega do localStorage (modo offline).
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
)
