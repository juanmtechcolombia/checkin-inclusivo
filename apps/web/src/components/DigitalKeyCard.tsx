import React, { useState } from 'react';
import { Key, Unlock, Lock, RefreshCw } from 'lucide-react';

interface DigitalKeyCardProps {
  roomNumber: string;
  onUnlock: () => Promise<{ success: boolean; message: string }>;
}

export const DigitalKeyCard: React.FC<DigitalKeyCardProps> = ({ roomNumber, onUnlock }) => {
  const [status, setStatus] = useState<'locked' | 'unlocking' | 'unlocked' | 'error'>('locked');
  const [message, setMessage] = useState('Presiona la tarjeta para abrir tu habitación');

  const handleUnlock = async () => {
    if (status === 'unlocking' || status === 'unlocked') return;

    setStatus('unlocking');
    setMessage('Comunicando con la cerradura...');

    try {
      const result = await onUnlock();
      if (result.success) {
        setStatus('unlocked');
        setMessage(result.message || '¡Puerta abierta! Puedes ingresar.');
        // Reset back to locked after 5 seconds
        setTimeout(() => {
          setStatus('locked');
          setMessage('Presiona la tarjeta para abrir tu habitación');
        }, 5000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Fallo de acceso. Intenta de nuevo.');
        setTimeout(() => {
          setStatus('locked');
        }, 3000);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Error de conexión con la cerradura.');
      setTimeout(() => {
        setStatus('locked');
      }, 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', margin: '2rem 0' }}>
      <div 
        onClick={handleUnlock}
        className={`key-card-mock ${
          status === 'unlocked' ? 'active' : status === 'unlocking' ? 'unlocking' : ''
        }`}
        style={{
          background: status === 'error' 
            ? 'linear-gradient(135deg, #b91c1c, #7f1d1d)' 
            : status === 'unlocked'
              ? 'linear-gradient(135deg, #15803d, #14532d)'
              : 'linear-gradient(135deg, var(--primary), #115e59)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
              Llave Digital
            </span>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.8rem' }}>Habitación {roomNumber}</h2>
          </div>
          {status === 'unlocked' ? <Unlock size={28} /> : <Lock size={28} />}
        </div>

        {/* Dynamic Center Visual */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          margin: '2rem 0',
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {status === 'unlocking' ? (
              <RefreshCw className="spin" size={36} style={{ animation: 'spin 1.5s linear infinite' }} />
            ) : status === 'unlocked' ? (
              <Unlock size={36} />
            ) : (
              <Key size={36} />
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.85rem' }}>
          <span>Hotel Sereno</span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 600
          }}>
            {status === 'unlocking' ? 'Abriendo...' : status === 'unlocked' ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
      </div>

      <p style={{
        textAlign: 'center',
        fontWeight: 500,
        fontSize: '0.95rem',
        color: status === 'error' ? 'var(--error)' : status === 'unlocked' ? 'var(--success)' : 'var(--text-secondary)',
        maxWidth: '280px',
        lineHeight: '1.4'
      }}>
        {message}
      </p>

      {/* CSS Spin Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
