import React, { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { 
  Volume2, VolumeX, Mail, Users, CheckCircle, Clock, Database 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const StaffPanel: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('admin@hotelsereno.co');
  const [password, setPassword] = useState('admin123');
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard state
  const [stats, setStats] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);


  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'arrivals' | 'audit' | 'config'>('arrivals');

  // Trigger login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/staff/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Credenciales de administrador incorrectas');
      }

      const data = await res.json();
      setToken(data.data.accessToken);
      setIsAuthenticated(true);
      
      // Load data immediately
      await loadDashboardData(data.data.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Error al conectar con el backend.');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (authToken: string) => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_URL}/api/hotel/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!statsRes.ok) throw new Error('Error al cargar estadísticas');
      const statsData = await statsRes.json();
      setStats(statsData.data);

      // 2. Fetch Reservations
      const resRes = await fetch(`${API_URL}/api/reservations`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!resRes.ok) throw new Error('Error al cargar reservaciones');
      const resData = await resRes.json();
      setReservations(resData.data);

      // 3. Fetch Config
      const configRes = await fetch(`${API_URL}/api/hotel/config`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!configRes.ok) throw new Error('Error al cargar configuración');
      await configRes.json();


      // 4. Fetch Audit Logs
      const auditRes = await fetch(`${API_URL}/api/audit`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.data);
      }

    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Quiet Lobby Mode
  const handleToggleQuietLobby = async (enabled: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/hotel/config/toggle-lobby`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled }),
      });

      if (!res.ok) throw new Error('No se pudo cambiar el modo de lobby');

      // Reload stats
      await loadDashboardData(token);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Send Pre Check-In Link
  const handleSendLink = async (reservationId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/reservations/${reservationId}/send-link`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('No se pudo enviar el enlace');
      alert('¡Enlace de pre-check-in enviado al correo del huésped!');
      
      // Reload
      await loadDashboardData(token);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setIsAuthenticated(false);
  };

  // Render Login Panel
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        <Header />
        <main className="container" style={{ padding: '4rem 1.5rem', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🏨</span>
              <h2 style={{ marginTop: '0.5rem', fontFamily: 'var(--font-title)' }}>Panel Administrativo</h2>
              <p style={{ fontSize: '0.85rem' }}>Inicia sesión para gestionar el lobby e inclusividad.</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input 
                  className="form-control" 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input 
                  className="form-control" 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required 
                />
              </div>

              {authError && (
                <div style={{ margin: '1rem 0', color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ {authError}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Iniciando sesión...' : 'Entrar al Panel'}
              </button>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Header showLogout={true} onLogout={handleLogout} />

      <main className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
        
        {/* Banner: Quiet Lobby Alert */}
        {stats?.quietLobbyActive ? (
          <div style={{ 
            background: 'var(--primary-light)', 
            borderLeft: '4px solid var(--primary)', 
            padding: '1.25rem 1.5rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }} className="fade-in">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <VolumeX size={24} color="var(--primary)" />
              <div>
                <strong style={{ color: 'var(--primary)', display: 'block' }}>Modo Lobby Tranquilo ACTIVADO</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Atenuar luces, mantener música de fondo al mínimo y modular la voz al hablar con huéspedes.
                </span>
              </div>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleToggleQuietLobby(false)}
              style={{ padding: '4px 12px', minHeight: '36px', height: '36px', fontSize: '0.8rem' }}
            >
              Desactivar
            </button>
          </div>
        ) : (
          <div style={{ 
            background: '#fff', 
            borderLeft: '4px solid #94a3b8', 
            padding: '1.25rem 1.5rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Volume2 size={24} color="#64748b" />
              <div>
                <strong style={{ color: '#475569', display: 'block' }}>Modo Estándar (Lobby Normal)</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Las preferencias estándar de aforo y sonido están configuradas.
                </span>
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => handleToggleQuietLobby(true)}
              style={{ padding: '4px 12px', minHeight: '36px', height: '36px', fontSize: '0.8rem' }}
            >
              Activar Modo Silencioso
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(15,118,110,0.1)', color: 'var(--primary)', padding: '10px', borderRadius: '8px' }}><Users size={20} /></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Hoy en Lobby</span>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats?.totalReservationsToday || 0}</h3>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(21,128,61,0.1)', color: 'var(--success)', padding: '10px', borderRadius: '8px' }}><CheckCircle size={20} /></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Check-in sin Recepción</span>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats?.completedWithoutReception || 0}</h3>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent)', padding: '10px', borderRadius: '8px' }}><Clock size={20} /></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>En Progreso</span>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats?.inProgressCheckIns || 0}</h3>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', padding: '10px', borderRadius: '8px' }}><Clock size={20} /></div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pendientes Hoy</span>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats?.pendingArrivals || 0}</h3>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', gap: '1rem' }}>
          <button 
            onClick={() => setActiveTab('arrivals')}
            style={{
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'arrivals' ? '3px solid var(--primary)' : 'none',
              color: activeTab === 'arrivals' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Llegadas de Hoy
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'audit' ? '3px solid var(--primary)' : 'none',
              color: activeTab === 'audit' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Registro de Auditoría (Privacidad)
          </button>
        </div>

        {/* TAB 1: ARRIVALS TABLE */}
        {activeTab === 'arrivals' && (
          <div className="card fade-in" style={{ overflowX: 'auto', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Control de Llegadas y Preferencias</h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem' }}>Huésped / Reserva</th>
                  <th style={{ padding: '0.75rem' }}>Estado</th>
                  <th style={{ padding: '0.75rem' }}>Llegada Estimada</th>
                  <th style={{ padding: '0.75rem' }}>Habitación</th>
                  <th style={{ padding: '0.75rem' }}>Alertas de Inclusividad</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => {
                  const prefs = res.guest?.accessibilityPreferences || {};
                  
                  return (
                    <tr key={res.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>
                          {res.guest?.firstName} {res.guest?.lastName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.bookingCode}</span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: res.status === 'CHECKED_IN' ? 'var(--success-light)' : 'var(--accent-light)',
                          color: res.status === 'CHECKED_IN' ? 'var(--success)' : 'var(--accent)'
                        }}>
                          {res.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 500 }}>
                        {res.checkIn?.selectedTimeWindow?.label || 'Sin seleccionar'}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>
                        {res.roomNumber || '—'}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {prefs.textOnly && (
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                              Solo Texto 💬
                            </span>
                          )}
                          {prefs.reducedMotion && (
                            <span style={{ background: '#f5f5f5', color: '#666', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                              Mov. Reducido
                            </span>
                          )}
                          {prefs.highContrast && (
                            <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                              Contraste
                            </span>
                          )}
                          {Object.keys(prefs).length === 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Estándar</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        {res.status === 'CONFIRMED' && (
                          <button 
                            className="btn btn-secondary"
                            onClick={() => handleSendLink(res.id)}
                            style={{ padding: '4px 10px', minHeight: '32px', fontSize: '0.8rem' }}
                          >
                            <Mail size={12} /> Invitar
                          </button>
                        )}
                        {res.status === 'PRE_CHECKIN' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Esperando Huésped</span>
                        )}
                        {res.status === 'CHECKED_IN' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Completado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay reservaciones registradas para hoy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="card fade-in" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Historial de Auditoría de Datos Personales</h3>
              <span style={{ fontSize: '0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <Database size={12} /> Ley 1581 Asegurada
              </span>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{ 
                  padding: '1rem', 
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  background: log.type.includes('FAIL') ? 'var(--error-light)' : '#ffffff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{log.type}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{log.details}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Actor: {log.actorRole} ({log.actorId})
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay eventos registrados en la bitácora.
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};
