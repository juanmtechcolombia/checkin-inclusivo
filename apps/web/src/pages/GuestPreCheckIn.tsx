import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CrowdIndicator } from '../components/CrowdIndicator';
import { Shield, User, Clock, Check, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import type { TimeWindow } from '@checkin/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const GuestPreCheckIn: React.FC = () => {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const navigate = useNavigate();

  // Reservation details
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration
  const [timeSlots, setTimeSlots] = useState<TimeWindow[]>([]);
  const [consentTexts, setConsentTexts] = useState<any[]>([]);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [showFullLegalText, setShowFullLegalText] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [documentNumber, setDocumentNumber] = useState('');

  // Accessibility Preferences
  const [textOnly, setTextOnly] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [preferredChannel, setPreferredChannel] = useState<'text' | 'email'>('text');

  // Selected time slot
  const [selectedSlot, setSelectedSlot] = useState<TimeWindow | null>(null);

  // Lookup booking details on mount
  useEffect(() => {
    if (!bookingCode) {
      setError('Código de reserva ausente');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // 1. Fetch Reservation
        const resResponse = await fetch(`${API_URL}/api/reservations/lookup/${bookingCode}`);
        if (!resResponse.ok) throw new Error('No pudimos encontrar tu reserva. Verifica el código.');
        const resData = await resResponse.json();
        
        setReservation(resData.data);
        
        // Populate initial form fields from DB reservation/guest
        const guest = resData.data.guest;
        setFirstName(guest.firstName || '');
        setLastName(guest.lastName || '');
        setEmail(guest.email || '');

        
        const prefs = guest.accessibilityPreferences || {};
        setTextOnly(prefs.textOnly !== undefined ? prefs.textOnly : true);
        setHighContrast(prefs.highContrast || false);
        setReducedMotion(prefs.reducedMotion || false);
        setScreenReader(prefs.screenReader || false);
        setPreferredChannel(prefs.preferredChannel || 'text');

        // If check-in status is already completed, redirect
        if (resData.data.checkIn?.status === 'COMPLETADO') {
          navigate(`/key-gate/${bookingCode}`);
          return;
        }

        // 2. Fetch Hotel Configuration (Consent texts, time windows)
        const configResponse = await fetch(`${API_URL}/api/hotel/config`);
        if (configResponse.ok) {
          const configData = await configResponse.json();
          setTimeSlots(configData.data.availableTimeWindows || []);
          setConsentTexts(configData.data.consentTexts || []);
        }

      } catch (err: any) {
        setError(err.message || 'Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingCode, navigate]);

  const handleNextStep = () => {
    if (currentStep === 1 && !consentAccepted) {
      alert('Debe aceptar la política de tratamiento de datos personales.');
      return;
    }
    if (currentStep === 2 && (!firstName || !lastName || !email || !documentNumber)) {
      alert('Por favor complete todos los datos obligatorios (incluyendo documento de identidad).');
      return;
    }
    if (currentStep === 3 && !selectedSlot) {
      alert('Por favor seleccione una franja horaria de llegada.');
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmitPreCheckIn = async () => {
    setSubmitting(true);
    try {
      const checkInId = reservation.checkIn?.id;
      if (!checkInId) throw new Error('Check-in ID no encontrado');

      // Guest Login to get Token
      const loginRes = await fetch(`${API_URL}/api/auth/guest/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingCode, lastName }),
      });

      if (!loginRes.ok) throw new Error('Error de autenticación para guardar cambios');
      const loginData = await loginRes.json();
      const token = loginData.data.accessToken;

      // 1. Save Accessibility Preferences
      const prefRes = await fetch(`${API_URL}/api/guests/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accessibilityPreferences: {
            textOnly,
            highContrast,
            reducedMotion,
            screenReader,
            preferredChannel
          }
        }),
      });

      if (!prefRes.ok) throw new Error('Error al guardar preferencias de accesibilidad');

      // 2. Validate Data (Consent Accept & Document)
      const validateRes = await fetch(`${API_URL}/api/checkin/${checkInId}/validate-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          consentAccepted: true,
          consentScopes: ['PERSONAL_DATA', 'IDENTITY_DOCUMENT', 'ACCESSIBILITY_PREFERENCES', 'LOCATION_DATA'],
          documentNumber
        }),
      });

      if (!validateRes.ok) throw new Error('Error al verificar tus datos y guardar consentimiento');

      // 3. Save Time Window Selection
      const slotRes = await fetch(`${API_URL}/api/checkin/${checkInId}/select-window`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timeWindow: selectedSlot }),
      });

      if (!slotRes.ok) throw new Error('Error al guardar horario de llegada');

      // Store guest session token in localStorage for next step authentication
      localStorage.setItem(`checkin_token_${bookingCode}`, token);

      // Advance to success/confirmation gate
      navigate(`/key-gate/${bookingCode}`);

    } catch (err: any) {
      alert(err.message || 'Fallo al procesar el pre-check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  // Simulate crowd density for visual demonstration (low / mid / high)
  const getSlotDensity = (slotId: string) => {
    switch (slotId) {
      case 'tw-1': return 25; // 12-14
      case 'tw-2': return 82; // 14-16 (Peak check-in hour)
      case 'tw-3': return 45; // 16-18
      case 'tw-4': return 35; // 18-20
      default: return 15;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem', background: 'var(--bg-primary)' }}>
        🌿 Cargando tu check-in...
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        <Header />
        <main className="container" style={{ padding: '4rem 1.5rem', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ maxWidth: '500px', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--error)' }}>Ocurrió un Problema</h2>
            <p style={{ margin: '1rem 0' }}>{error || 'No pudimos verificar tu código de reserva.'}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Header />
      
      <main className="container" style={{ padding: '2.5rem 1.5rem', flex: 1 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Welcome Info */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>CÓDIGO DE RESERVA: {bookingCode}</span>
            <h1 style={{ marginTop: '0.25rem' }}>¡Hola, {firstName || 'Huésped'}!</h1>
            <p>Comencemos tu pre-registro. Diseñamos este proceso para evitar esperas y ruidos en recepción.</p>
          </div>

          {/* Stepper Progress */}
          <div className="stepper-container">
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-circle">{currentStep > 1 ? <Check size={18} /> : '1'}</div>
              <div className="step-label">Privacidad</div>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-circle">{currentStep > 2 ? <Check size={18} /> : '2'}</div>
              <div className="step-label">Preferencias</div>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-circle">{currentStep > 3 ? <Check size={18} /> : '3'}</div>
              <div className="step-label">Horario</div>
            </div>
            <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
              <div className="step-circle">{currentStep > 4 ? <Check size={18} /> : '4'}</div>
              <div className="step-label">Guía</div>
            </div>
          </div>

          {/* STEP 1: Consent & Privacy */}
          {currentStep === 1 && (
            <div className="card fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <Shield size={28} color="var(--primary)" />
                <h2 style={{ margin: 0 }}>Tus datos están protegidos</h2>
              </div>
              <p>
                Para personalizar tu estadía e implementar las opciones de accesibilidad (como evitar la recepción), 
                requerimos tratar ciertos datos de tu reserva de acuerdo con la Ley 1581 de Protección de Datos.
              </p>

              {/* Easy Read version */}
              <div style={{ background: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-md)', margin: '1.5rem 0' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <FileText size={18} /> Lectura Fácil (Resumen)
                </h3>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Solo usamos tus datos para hacer tu check-in y acomodar tus preferencias de silencio.</li>
                  <li>Tus datos médicos o sensibles se cifran de forma estricta en una bóveda digital aislada.</li>
                  <li>Puedes solicitar borrar o retirar tus datos en cualquier momento.</li>
                </ul>
              </div>

              {/* Detailed legal disclosure */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => setShowFullLegalText(!showFullLegalText)}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'rgba(0,0,0,0.02)', padding: '0.75rem 1rem' }}
                >
                  <span>{showFullLegalText ? 'Ocultar' : 'Ver'} Términos Legales Completos (Ley 1581)</span>
                  <span>{showFullLegalText ? '▲' : '▼'}</span>
                </button>
                
                {showFullLegalText && (
                  <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    background: '#fff', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-sm)', 
                    marginTop: '0.75rem', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    textAlign: 'left',
                    whiteSpace: 'pre-line'
                  }}>
                    {consentTexts[0]?.fullText || 'Cargando textos legales...'}
                  </div>
                )}
              </div>

              {/* Accept checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '2rem 0 1rem' }}>
                <input 
                  type="checkbox" 
                  id="consent-check" 
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  style={{ width: '24px', height: '24px', cursor: 'pointer' }}
                />
                <label htmlFor="consent-check" style={{ fontWeight: 600, cursor: 'pointer' }}>
                  Entiendo y acepto el tratamiento de mis datos personales
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button className="btn btn-primary" onClick={handleNextStep}>
                  Siguiente paso <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preferences & Identity Data */}
          {currentStep === 2 && (
            <div className="card fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <User size={28} color="var(--primary)" />
                <h2 style={{ margin: 0 }}>Datos y Preferencias de Estadía</h2>
              </div>
              <p>Revisa tu información y dinos cómo podemos hacer tu check-in más cómodo.</p>

              <div className="grid-cols-2" style={{ margin: '1.5rem 0' }}>
                <div className="form-group">
                  <label className="form-label">Nombre(s) obligatorio</label>
                  <input className="form-control" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido(s) obligatorio</label>
                  <input className="form-control" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Correo electrónico</label>
                  <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Documento de Identidad (Cifrado seguro)</label>
                  <input 
                    className="form-control" 
                    type="text" 
                    placeholder="Ej. C.C. 10203040" 
                    value={documentNumber} 
                    onChange={e => setDocumentNumber(e.target.value)} 
                    required 
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Requerido para ley nacional de registro hotelero.</small>
                </div>
              </div>

              {/* Preferences Grid */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Preferencias de Accesibilidad (Opcionales)</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      id="pref-textonly" 
                      checked={textOnly} 
                      onChange={e => setTextOnly(e.target.checked)} 
                      style={{ width: '20px', height: '20px', marginTop: '3px' }}
                    />
                    <div>
                      <label htmlFor="pref-textonly" style={{ fontWeight: 600, display: 'block' }}>Interacciones de solo texto</label>
                      <small style={{ color: 'var(--text-secondary)' }}>Prefiero comunicarme mediante chat o mensajería de texto y evitar llamadas de voz del staff.</small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      id="pref-contrast" 
                      checked={highContrast} 
                      onChange={e => setHighContrast(e.target.checked)} 
                      style={{ width: '20px', height: '20px', marginTop: '3px' }}
                    />
                    <div>
                      <label htmlFor="pref-contrast" style={{ fontWeight: 600, display: 'block' }}>Visualización de alto contraste</label>
                      <small style={{ color: 'var(--text-secondary)' }}>Configura la interfaz web con colores de alto contraste para facilitar la lectura.</small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      id="pref-motion" 
                      checked={reducedMotion} 
                      onChange={e => setReducedMotion(e.target.checked)} 
                      style={{ width: '20px', height: '20px', marginTop: '3px' }}
                    />
                    <div>
                      <label htmlFor="pref-motion" style={{ fontWeight: 600, display: 'block' }}>Movimientos reducidos</label>
                      <small style={{ color: 'var(--text-secondary)' }}>Desactiva efectos y animaciones en la pantalla para una experiencia más calma.</small>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem' }} className="form-group">
                  <label className="form-label">Canal preferido de comunicación</label>
                  <select 
                    className="form-control" 
                    value={preferredChannel} 
                    onChange={e => setPreferredChannel(e.target.value as 'text' | 'email')}
                    style={{ maxWidth: '300px' }}
                  >
                    <option value="text">Mensajería de Texto / WhatsApp</option>
                    <option value="email">Correo electrónico</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={handlePrevStep}>
                  <ArrowLeft size={18} /> Atrás
                </button>
                <button className="btn btn-primary" onClick={handleNextStep}>
                  Siguiente paso <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Arrival Time Windows & Crowd Forecasting */}
          {currentStep === 3 && (
            <div className="card fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Clock size={28} color="var(--primary)" />
                <h2 style={{ margin: 0 }}>Selecciona tu Horario de Llegada</h2>
              </div>
              <p>Escoge el horario en que planeas llegar. Mostramos el aforo estimado para ayudarte a elegir un momento tranquilo.</p>

              {/* Time slots list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '2rem 0' }}>
                {timeSlots.map(slot => {
                  const density = getSlotDensity(slot.id);
                  const isSelected = selectedSlot?.id === slot.id;

                  return (
                    <div 
                      key={slot.id}
                      onClick={() => {
                        if (slot.available) setSelectedSlot(slot);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '1.25rem',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--primary-light)' : '#ffffff',
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        opacity: slot.available ? 1 : 0.5,
                        transition: 'all 0.2s',
                        outline: isSelected ? '2px solid var(--primary)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {slot.label}
                        </span>
                        {!slot.available ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--error)', fontWeight: 600 }}>Completo</span>
                        ) : isSelected ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Check size={16} /> Seleccionado
                          </span>
                        ) : null}
                      </div>

                      {slot.available && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Afluencia en lobby:</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: density > 75 ? 'var(--error)' : density > 40 ? 'var(--accent)' : 'var(--success)'
                          }}>
                            {density > 75 ? 'Alta' : density > 40 ? 'Moderada' : 'Baja'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dynamic crowd forecast warning indicator */}
              {selectedSlot && (
                <CrowdIndicator density={getSlotDensity(selectedSlot.id)} />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={handlePrevStep}>
                  <ArrowLeft size={18} /> Atrás
                </button>
                <button className="btn btn-primary" onClick={handleNextStep}>
                  Siguiente paso <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Arrival Guide & Save */}
          {currentStep === 4 && (
            <div className="card fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Check size={28} color="var(--success)" />
                <h2 style={{ margin: 0 }}>Instrucciones de tu Llegada</h2>
              </div>
              <p>Tu pre-registro está completo. Sigue estos pasos al llegar para ir directo a tu habitación de forma autónoma:</p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                margin: '2.5rem 0',
                background: '#ffffff',
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Llegada al Hotel</strong>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Preséntate en el hotel durante tu franja horaria seleccionada: <strong>{selectedSlot?.label}</strong>.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Usa esta aplicación</strong>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cuando estés en el lobby, abre la página móvil del check-in. Te enviaremos un SMS para recordarte.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Autenticación sin contacto</strong>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Escanea el código QR del tótem del lobby o ingresa el código OTP que recibirás en tu celular para activar tu acceso.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>4</div>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Llave digital activa</strong>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>La aplicación te dará el número de tu habitación (ej. 301) y activará tu llave móvil. Solo debes acercar tu celular a la puerta. ¡Listo!</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={handlePrevStep} disabled={submitting}>
                  <ArrowLeft size={18} /> Atrás
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSubmitPreCheckIn}
                  disabled={submitting}
                >
                  {submitting ? 'Guardando pre-check-in...' : 'Confirmar Registro y Finalizar'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};
