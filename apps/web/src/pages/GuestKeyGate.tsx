import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { DigitalKeyCard } from '../components/DigitalKeyCard';
import { QrCode, Smartphone, ArrowRight, CheckCircle } from 'lucide-react';
import { CheckInStatus, AuthChallengeType } from '@checkin/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const GuestKeyGate: React.FC = () => {
  const { bookingCode } = useParams<{ bookingCode: string }>();


  // Authentication session
  const [token, setToken] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Challenge variables
  const [challenge, setChallenge] = useState<any>(null);
  const [otpCode, setOtpCode] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Status message
  const [actionMessage, setActionMessage] = useState('');

  // 1. Authenticate guest using token in localStorage, or login
  useEffect(() => {
    const authenticateAndFetch = async () => {
      try {
        let storedToken = localStorage.getItem(`checkin_token_${bookingCode}`);
        
        // If no token in local storage, login using guest credentials
        if (!storedToken) {
          // Lookup reservation first to get lastName
          const lookupResponse = await fetch(`${API_URL}/api/reservations/lookup/${bookingCode}`);
          if (!lookupResponse.ok) throw new Error('Reserva no encontrada');
          const lookupData = await lookupResponse.json();
          const lastName = lookupData.data.guest.lastName;

          const loginResponse = await fetch(`${API_URL}/api/auth/guest/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingCode, lastName }),
          });

          if (!loginResponse.ok) throw new Error('Acceso no autorizado a la llave digital');
          const loginData = await loginResponse.json();
          storedToken = loginData.data.accessToken;
          localStorage.setItem(`checkin_token_${bookingCode}`, storedToken!);
        }

        setToken(storedToken);
        await fetchCheckInDetails(storedToken!);

      } catch (err: any) {
        setError(err.message || 'Error de conexión.');
        setLoading(false);
      }
    };

    authenticateAndFetch();
  }, [bookingCode]);

  const fetchCheckInDetails = async (authToken: string) => {
    try {
      // Fetch reservation lookup first to get check-in ID
      const lookupResponse = await fetch(`${API_URL}/api/reservations/lookup/${bookingCode}`);
      if (!lookupResponse.ok) throw new Error('No pudimos recuperar tu reserva');
      const lookupData = await lookupResponse.json();
      
      const checkInId = lookupData.data.checkIn?.id;
      if (!checkInId) throw new Error('Proceso de check-in no iniciado');

      const res = await fetch(`${API_URL}/api/checkin/${checkInId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Error al cargar datos del check-in');
      const data = await res.json();
      setCheckIn(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP or QR challenge
  const handleRequestChallenge = async (type: AuthChallengeType) => {
    if (!token || !checkIn) return;
    setActionMessage('Generando código...');
    try {
      const res = await fetch(`${API_URL}/api/auth/challenge/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ checkInId: checkIn.id, type }),
      });

      if (!res.ok) throw new Error('Error al solicitar autenticación');
      const data = await res.json();
      setChallenge(data.data);
      
      if (type === AuthChallengeType.OTP) {
        setActionMessage('El código OTP ha sido enviado (mira la consola del backend para ver el código mock).');
      } else {
        setActionMessage('Se generó el código QR para el lobby. Simula escaneo abajo.');
        setQrValue(data.data.displayValue);
      }
    } catch (err: any) {
      setActionMessage(`Fallo: ${err.message}`);
    }
  };

  // 3. Verify challenge
  const handleVerifyChallenge = async (valueToVerify: string) => {
    if (!token || !challenge) return;
    setIsVerifying(true);
    setActionMessage('Verificando...');
    try {
      const res = await fetch(`${API_URL}/api/auth/challenge/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          type: challenge.type,
          value: valueToVerify,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Código incorrecto o expirado.');
      }

      setActionMessage('¡Autenticado exitosamente! Generando tu llave...');
      setChallenge(null);
      // Reload check-in details
      await fetchCheckInDetails(token);

    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // 4. Issue digital key card
  const handleIssueKey = async () => {
    if (!token || !checkIn) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/checkin/${checkIn.id}/issue-key`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Fallo al emitir la llave en el servidor');
      const data = await res.json();
      setCheckIn(data.data);
      setActionMessage('¡Tu llave digital ha sido emitida!');
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. Open door trigger
  const handleUnlockDoor = async () => {
    if (!token || !checkIn) return { success: false, message: 'Falta token' };
    
    const res = await fetch(`${API_URL}/api/checkin/${checkIn.id}/open-door`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      return { success: false, message: 'Fallo al conectar con la cerradura' };
    }
    
    const data = await res.json();
    return {
      success: data.success,
      message: data.data?.message || 'Acceso concedido',
    };
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', background: 'var(--bg-primary)' }}>
        🌿 Cargando llave digital...
      </div>
    );
  }

  if (error || !checkIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        <Header />
        <main className="container" style={{ padding: '4rem 1.5rem', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--error)' }}>Error de Acceso</h2>
            <p style={{ margin: '1rem 0' }}>{error || 'No pudimos verificar tu sesión de huésped.'}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { status, reservation: resDetails, digitalKey } = checkIn;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Header />

      <main className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Header Status */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>PORTAL DEL HUÉSPED</span>
            <h1 style={{ fontSize: '1.75rem', marginTop: '0.25rem', fontFamily: 'var(--font-title)' }}>Tu Entrada Digital</h1>
            <p style={{ fontSize: '0.9rem' }}>Reserva: <strong>{bookingCode}</strong> — Huésped: {resDetails.guest.firstName} {resDetails.guest.lastName}</p>
          </div>

          {/* STEP A: Not yet authenticated (status = INVITADO / DATOS_VALIDADOS / VENTANA_SELECCIONADA) */}
          {(status === CheckInStatus.INVITADO || 
            status === CheckInStatus.DATOS_VALIDADOS || 
            status === CheckInStatus.VENTANA_SELECCIONADA) && (
            <div className="card fade-in">
              <h3>Autenticación en el Lobby</h3>
              <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 1.5rem' }}>
                Para verificar que te encuentras físicamente en el hotel y proteger tu privacidad, por favor selecciona un método de autenticación rápida.
              </p>

              {/* Action options */}
              {!challenge ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleRequestChallenge(AuthChallengeType.OTP)}
                    style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '1.25rem' }}
                  >
                    <Smartphone size={20} color="var(--primary)" />
                    <div>
                      <strong style={{ display: 'block' }}>Recibir código SMS / Email</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Te enviaremos un código de 6 dígitos</span>
                    </div>
                  </button>

                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleRequestChallenge(AuthChallengeType.QR)}
                    style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '1.25rem' }}
                  >
                    <QrCode size={20} color="var(--primary)" />
                    <div>
                      <strong style={{ display: 'block' }}>Escanear código QR</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Escanea el código QR visible en el tótem de recepción</span>
                    </div>
                  </button>
                </div>
              ) : (
                /* Challenge Verification Form */
                <div style={{ marginTop: '1.5rem', textAlign: 'left' }} className="fade-in">
                  {challenge.type === AuthChallengeType.OTP ? (
                    <div className="form-group">
                      <label className="form-label">Introduce el código OTP de 6 dígitos</label>
                      <input 
                        className="form-control" 
                        type="text" 
                        maxLength={6} 
                        placeholder="Ej. 123456" 
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
                      />
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleVerifyChallenge(otpCode)}
                        disabled={otpCode.length !== 6 || isVerifying}
                        style={{ width: '100%', marginTop: '1rem' }}
                      >
                        Verificar Código <ArrowRight size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="form-group" style={{ textAlign: 'center' }}>
                      <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', margin: '1rem 0' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CÓDIGO QR MOCK DEL TÓTEM</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0', color: 'var(--primary)' }}>
                          {qrValue}
                        </div>
                        <small style={{ color: 'var(--text-secondary)' }}>En la recepción de hotel verías esta tarjeta QR.</small>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleVerifyChallenge(qrValue)}
                        disabled={isVerifying}
                        style={{ width: '100%' }}
                      >
                        Simular Escaneo de QR del Tótem
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => setChallenge(null)} 
                    className="btn btn-secondary" 
                    style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-secondary)' }}
                  >
                    Elegir otro método
                  </button>
                </div>
              )}

              {actionMessage && (
                <div style={{ 
                  marginTop: '1.25rem', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}>
                  {actionMessage}
                </div>
              )}
            </div>
          )}

          {/* STEP B: Authenticated but key not yet issued (status = AUTENTICADO) */}
          {status === CheckInStatus.AUTENTICADO && (
            <div className="card fade-in">
              <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
              <h3>¡Identidad Confirmada!</h3>
              <p style={{ margin: '0.5rem 0 1.5rem' }}>
                Tu identidad se verificó exitosamente. Ahora el sistema te asignará una habitación automáticamente según tus preferencias de accesibilidad.
              </p>

              <button className="btn btn-primary" onClick={handleIssueKey} style={{ width: '100%' }}>
                Generar Llave Digital y Habitación
              </button>

              {actionMessage && (
                <div style={{ marginTop: '1rem', color: 'var(--primary)', fontSize: '0.9rem' }}>
                  {actionMessage}
                </div>
              )}
            </div>
          )}

          {/* STEP C: Fully checked-in (status = COMPLETADO / LLAVE_EMITIDA) */}
          {(status === CheckInStatus.COMPLETADO || status === CheckInStatus.LLAVE_EMITIDA) && digitalKey && (
            <div className="card fade-in" style={{ padding: '1.5rem' }}>
              <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '8px 16px', borderRadius: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                <CheckCircle size={16} /> Registro Completado
              </div>
              
              <h3 style={{ marginBottom: '0.5rem' }}>Tu Habitación está Lista</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Puedes ir directamente a la habitación <strong>{digitalKey.roomNumber}</strong>. No es necesario pasar por recepción.
              </p>

              {/* Digital Lock mock interface card */}
              <DigitalKeyCard roomNumber={digitalKey.roomNumber} onUnlock={handleUnlockDoor} />

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                <strong>Instrucciones de llegada al cuarto:</strong>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <li>Toma el ascensor al piso correspondiente.</li>
                  <li>Activa el bluetooth de tu celular.</li>
                  <li>Presiona el botón verde de la tarjeta arriba para destrabar el cerrojo.</li>
                </ul>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};
