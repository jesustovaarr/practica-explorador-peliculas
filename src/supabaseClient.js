import { createClient } from '@supabase/supabase-js';

// Lectura de variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Instancia del cliente de Supabase apuntando al esquema de peliculas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'peliculas' }
});
