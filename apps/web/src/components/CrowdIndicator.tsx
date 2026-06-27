import React from 'react';
import { Users, CheckCircle, AlertTriangle } from 'lucide-react';

interface CrowdIndicatorProps {
  /** Percentage of simulated crowd capacity (0 to 100) */
  density: number;
}

export const CrowdIndicator: React.FC<CrowdIndicatorProps> = ({ density }) => {
  const getStatus = () => {
    if (density < 40) {
      return {
        label: 'Baja Afluencia (Tranquilo)',
        color: 'var(--success)',
        bgColor: 'var(--success-light)',
        icon: <CheckCircle size={16} color="var(--success)" />,
        desc: 'El lobby estará muy despejado. Proceso rápido y sin filas.',
      };
    } else if (density < 75) {
      return {
        label: 'Afluencia Moderada',
        color: 'var(--accent)',
        bgColor: 'var(--accent-light)',
        icon: <Users size={16} color="var(--accent)" />,
        desc: 'Podría haber algo de movimiento. El personal estará disponible.',
      };
    } else {
      return {
        label: 'Alta Afluencia (Hora Pico)',
        color: 'var(--error)',
        bgColor: 'var(--error-light)',
        icon: <AlertTriangle size={16} color="var(--error)" />,
        desc: 'Suele haber más ruido y personas en recepción. Te sugerimos franjas más tempranas o tardías.',
      };
    }
  };

  const status = getStatus();

  return (
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      border: '1px solid var(--border-color)',
      margin: '1.5rem 0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Users size={18} />
          <span>Afluencia estimada del lobby:</span>
        </div>
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: status.color,
          background: status.bgColor,
          padding: '4px 10px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '10px',
        background: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '5px',
        overflow: 'hidden',
        marginBottom: '0.5rem',
      }}>
        <div style={{
          width: `${density}%`,
          height: '100%',
          backgroundColor: status.color,
          borderRadius: '5px',
          transition: 'width 0.5s ease-in-out',
        }} />
      </div>

      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {status.desc}
      </p>
    </div>
  );
};
