import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Search, 
  Play, 
  Star, 
  Calendar, 
  Users, 
  TrendingUp, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Info
} from 'lucide-react';
import './index.css';

// Logo de Watchy
function WatchyLogo() {
  return (
    <div className="watchy-logo-wrapper">
      <div className="watchy-logo-badge">
        <Play size={15} className="watchy-play-icon" />
      </div>
      <span className="brand-title">Watchy</span>
    </div>
  );
}

// Icono de GitHub
function GithubIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [peliculas, setPeliculas] = useState([]);
  const [peliculaSeleccionada, setPeliculaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de paginacion
  const [paginaActual, setPaginaActual] = useState(1);
  const ELEMENTOS_POR_PAGINA = 12;

  // Verificacion de sesion activa en Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Consulta de peliculas exclusivamente desde la tabla catalogo en Supabase
  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      setError(null);

      const { data, error: supaError } = await supabase
        .from('catalogo')
        .select('*')
        .order('popularidad', { ascending: false });

      if (supaError) throw supaError;
      setPeliculas(data || []);
    } catch (err) {
      console.error('Error al consultar Supabase:', err.message);
      setError('No se pudo conectar con la base de datos de películas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (session) {
      cargarCatalogo();
    }
  }, [session]);

  // Inicio de sesion mediante OAuth de GitHub
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error en login:', error.message);
  };

  // Cierre de sesion de usuario
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPeliculas([]);
    setPeliculaSeleccionada(null);
  };

  // Filtrado de peliculas por titulo o año
  const peliculasFiltradas = peliculas.filter(p =>
    p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.year && p.year.toString().includes(busqueda))
  );

  // Calculo de paginacion
  const totalPaginas = Math.ceil(peliculasFiltradas.length / ELEMENTOS_POR_PAGINA) || 1;
  const indiceInicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
  const peliculasPaginadas = peliculasFiltradas.slice(indiceInicio, indiceInicio + ELEMENTOS_POR_PAGINA);

  // Reiniciar a la pagina 1 al cambiar el texto de busqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // Pantalla de autenticacion
  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-glow"></div>
        <div className="auth-card">
          <div className="auth-logo-center">
            <WatchyLogo />
          </div>
          <h1>Bienvenido a Watchy</h1>
          <p>Tu plataforma de streaming conectada a Supabase.</p>
          <button onClick={handleLogin} className="btn-github">
            <GithubIcon size={20} />
            <span>Continuar con GitHub</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="movies-layout">
      {/* Barra superior */}
      <header className="topbar">
        <WatchyLogo />

        {/* Buscador de peliculas */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar película..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Perfil del usuario */}
        <div className="user-profile">
          <img 
            src={session.user.user_metadata?.avatar_url || 'https://via.placeholder.com/40'} 
            alt="Avatar" 
            className="avatar"
          />
          <span className="username">
            {session.user.user_metadata?.user_name || session.user.user_metadata?.full_name || 'Usuario'}
          </span>
          <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="main-content">
        {/* Barra de título y paginación */}
        <div className="section-header-compact">
          <div className="section-title-wrap">
            <h2>Películas</h2>
            <span className="section-subtitle">Producciones más populares</span>
          </div>

          <div className="page-indicator">
            <span className="page-label">Página</span>
            <span className="page-badge-current">{paginaActual}</span>
            <span className="page-divider">de</span>
            <span className="page-badge-total">{totalPaginas}</span>
          </div>
        </div>

        {error && (
          <div className="alert-error">
            <span>{error}</span>
          </div>
        )}

        {cargando ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando producciones...</p>
          </div>
        ) : (
          <>
            {peliculasPaginadas.length === 0 ? (
              <div className="empty-state">
                <p>No se encontraron películas para esa búsqueda.</p>
              </div>
            ) : (
              <div className="movies-grid">
                {peliculasPaginadas.map((pelicula) => (
                  <article
                    key={pelicula.id}
                    onClick={() => setPeliculaSeleccionada(pelicula)}
                    className="movie-card"
                  >
                    <div className="poster-wrapper">
                      {pelicula.poster_url ? (
                        <img 
                          src={pelicula.poster_url} 
                          alt={pelicula.titulo} 
                          className="poster-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="poster-placeholder">
                          <span>Sin Póster</span>
                        </div>
                      )}

                      <div className="rating-badge">
                        <Star size={13} className="star-icon" />
                        <span>{pelicula.calificacion}</span>
                      </div>

                      <div className="card-hover-overlay">
                        <div className="btn-quick-view">
                          <Info size={16} />
                          <span>Ver detalle</span>
                        </div>
                      </div>
                    </div>

                    <div className="movie-info">
                      <h4 className="movie-title" title={pelicula.titulo}>{pelicula.titulo}</h4>
                      <span className="movie-year">{pelicula.year}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Controles de paginacion */}
            {totalPaginas > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                  className="btn-page"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>

                <div className="page-numbers">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => setPaginaActual(num)}
                      className={`btn-page-num ${paginaActual === num ? 'active' : ''}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="btn-page"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Detalle de Pelicula */}
      {peliculaSeleccionada && (
        <div className="modal-overlay" onClick={() => setPeliculaSeleccionada(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPeliculaSeleccionada(null)} 
              className="btn-modal-close"
              title="Cerrar"
            >
              <X size={20} />
            </button>

            {peliculaSeleccionada.backdrop_url && (
              <div 
                className="modal-backdrop" 
                style={{ backgroundImage: `url(${peliculaSeleccionada.backdrop_url})` }}
              >
                <div className="modal-backdrop-gradient"></div>
              </div>
            )}

            <div className="modal-body">
              <div className="modal-poster-wrap">
                {peliculaSeleccionada.poster_url && (
                  <img 
                    src={peliculaSeleccionada.poster_url} 
                    alt={peliculaSeleccionada.titulo} 
                    className="modal-poster-img"
                  />
                )}
              </div>

              <div className="modal-details">
                <h2 className="modal-title">{peliculaSeleccionada.titulo}</h2>
                
                <div className="modal-meta-row">
                  <span className="meta-pill rating">
                    <Star size={13} />
                    <span>{peliculaSeleccionada.calificacion}</span>
                  </span>
                  <span className="meta-pill year">
                    <Calendar size={13} />
                    <span>{peliculaSeleccionada.year}</span>
                  </span>
                  <span className="meta-pill votes">
                    <Users size={13} />
                    <span>{peliculaSeleccionada.votos.toLocaleString()} votos</span>
                  </span>
                  <span className="meta-pill popularity">
                    <TrendingUp size={13} />
                    <span>Popularidad {peliculaSeleccionada.popularidad}</span>
                  </span>
                </div>

                <div className="modal-synopsis">
                  <h4>Sinopsis</h4>
                  <p>{peliculaSeleccionada.sinopsis}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
