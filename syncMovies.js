import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Carga de variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;

if (!supabaseUrl || !supabaseKey || !tmdbApiKey) {
  console.error('[Error]: Faltan variables de entorno requeridas en .env');
  process.exit(1);
}

// Inicializacion del cliente de Supabase apuntando al esquema peliculas
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'peliculas' }
});

// Consulta peliculas populares de TMDb en idioma espanol
async function consultarPeliculasPopulares(pagina = 1) {
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=es-MX&page=${pagina}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error en API de TMDb: ${res.statusText}`);
  }
  return await res.json();
}

// Ingesta de multiples paginas de peliculas hacia Supabase
async function sincronizarCatalogo() {
  console.log('[Info]: Iniciando ingesta masiva: TMDb -> Supabase (Schema: peliculas)...');

  // Descargar las primeras 3 paginas (60 peliculas populares)
  const paginasTotales = 3;
  let totalInsertadas = 0;

  for (let p = 1; p <= paginasTotales; p++) {
    try {
      console.log(`[Info]: Consultando pagina ${p} de TMDb...`);
      const data = await consultarPeliculasPopulares(p);
      const peliculas = data.results || [];

      for (const item of peliculas) {
        // Normalizacion del modelo de datos de peliculas
        const registro = {
          tmdb_id: item.id,
          titulo: item.title || item.original_title,
          year: item.release_date ? item.release_date.substring(0, 4) : 'N/A',
          sinopsis: item.overview || 'Sin descripción disponible.',
          poster_url: item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : null,
          backdrop_url: item.backdrop_path
            ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
            : null,
          calificacion: parseFloat((item.vote_average || 0).toFixed(1)),
          votos: item.vote_count || 0,
          popularidad: parseFloat((item.popularity || 0).toFixed(2)),
          creado_en: new Date().toISOString()
        };

        // Persistencia idempotente mediante UPSERT por identificador tmdb_id
        const { error } = await supabase
          .from('catalogo')
          .upsert(registro, { onConflict: 'tmdb_id' });

        if (error) {
          console.error(`[Error]: Fallo al guardar "${registro.titulo}":`, error.message);
        } else {
          totalInsertadas++;
          console.log(`[Exito]: ${registro.titulo} (${registro.year}) | Nota: ${registro.calificacion}`);
        }
      }
    } catch (err) {
      console.error(`[Advertencia]: Error en pagina ${p}:`, err.message);
    }
  }

  console.log(`[Info]: Ingesta finalizada. Total de peliculas persistidas: ${totalInsertadas}`);
}

sincronizarCatalogo();
