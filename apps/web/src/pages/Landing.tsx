import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Key, Calendar, ArrowRight, HelpCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [bookingCode, setBookingCode] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanCode = bookingCode.trim().toUpperCase();
    const cleanName = lastName.trim();

    try {
      // Lookup reservation
      const res = await fetch(`${API_URL}/api/reservations/lookup/${cleanCode}`);
      
      if (!res.ok) {
        throw new Error('No encontramos tu reserva. Por favor verifica el código e intenta de nuevo.');
      }
      
      const data = await res.json();
      const reservation = data.data;

      // Verify last name matches in lowercase
      const cleanLastName = reservation.guest.lastName.toLowerCase();
      if (!cleanLastName.includes(cleanName.toLowerCase()) && !cleanName.toLowerCase().includes(cleanLastName)) {
        throw new Error('El apellido ingresado no coincide con el registro de la reserva.');
      }

      // Check status to determine route
      if (reservation.checkIn?.status === 'COMPLETADO') {
        navigate(`/key-gate/${cleanCode}`);
      } else {
        navigate(`/check-in/${cleanCode}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Header />

      <main className="container" style={{ padding: '3.5rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', alignItems: 'center', maxWidth: '1000px', margin: '0 auto' }} className="grid-cols-2">
          
          {/* Pitch Panel */}
          <div>
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-title)', color: 'var(--primary)', marginBottom: '1.5rem' }}>
              Tu Estadía Comienza en Silencio
            </h1>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
              Bienvenido al sistema de check-in accesible de <strong>Hotel Sereno</strong>.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
              Completa tu registro en línea, selecciona tu horario de afluencia ideal y obtén tu llave digital para ingresar directamente a tu habitación, sin filas, llamadas ni esperas en el lobby.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '50%', color: 'var(--primary)' }}><Calendar size={18} /></div>
                <div>
                  <strong style={{ display: 'block' }}>Pre-registro flexible</strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Dinos tus preferencias de accesibilidad y silencio.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '50%', color: 'var(--primary)' }}><Key size={18} /></div>
                <div>
                  <strong style={{ display: 'block' }}>Llave Móvil Segura</strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Desbloquea tu habitación directamente con tu celular.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="card">
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>Buscar Reserva</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="booking-input">Código de Reserva</label>
                <input 
                  id="booking-input"
                  className="form-control" 
                  type="text" 
                  placeholder="Ej. SERENO-2024-001" 
                  value={bookingCode}
                  onChange={e => setBookingCode(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastname-input">Primer Apellido</label>
                <input 
                  id="lastname-input"
                  className="form-control" 
                  type="text" 
                  placeholder="Ej. García" 
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required 
                />
              </div>

              {error && (
                <div style={{ 
                  margin: '1rem 0', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'var(--error-light)', 
                  color: 'var(--error)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <HelpCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Buscando...' : 'Iniciar Check-in'} <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <a href="/staff" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                Acceder al Panel de Staff / Recepción →
              </a>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
