import React from 'react';
import { Eye, Type, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout?: () => void;
  showLogout?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, showLogout = false }) => {
  const toggleHighContrast = () => {
    document.body.classList.toggle('high-contrast');
  };

  const adjustTextSize = (action: 'increase' | 'decrease' | 'reset') => {
    const root = document.documentElement;
    const currentScale = parseFloat(getComputedStyle(root).getPropertyValue('--text-scale') || '1');
    
    let newScale = currentScale;
    if (action === 'increase' && currentScale < 1.4) {
      newScale = currentScale + 0.1;
    } else if (action === 'decrease' && currentScale > 0.8) {
      newScale = currentScale - 0.1;
    } else if (action === 'reset') {
      newScale = 1;
    }
    
    root.style.setProperty('--text-scale', newScale.toString());
  };

  return (
    <header style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(8px)',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            fontFamily: 'var(--font-title)',
            color: 'var(--primary)',
            letterSpacing: '-0.5px'
          }}>
            🌿 Sereno
          </span>
          <span style={{
            fontSize: '0.8rem',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 600
          }}>
            Inclusivo
          </span>
        </div>

        {/* Accessibility Panel & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Text Size Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px' }}>
            <button 
              onClick={() => adjustTextSize('decrease')} 
              className="access-btn" 
              title="Disminuir tamaño de letra"
              style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', boxShadow: 'none' }}
            >
              <Type size={14} />-
            </button>
            <button 
              onClick={() => adjustTextSize('reset')} 
              className="access-btn" 
              title="Restablecer tamaño de letra"
              style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', boxShadow: 'none', fontSize: '0.8rem', fontWeight: 600 }}
            >
              100%
            </button>
            <button 
              onClick={() => adjustTextSize('increase')} 
              className="access-btn" 
              title="Aumentar tamaño de letra"
              style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', boxShadow: 'none' }}
            >
              <Type size={14} />+
            </button>
          </div>

          {/* High Contrast Mode Toggle */}
          <button
            onClick={toggleHighContrast}
            className="access-btn"
            title="Modo alto contraste"
            style={{ width: '36px', height: '36px' }}
          >
            <Eye size={18} />
          </button>

          {/* Logout button (optional) */}
          {showLogout && onLogout && (
            <button
              onClick={onLogout}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.75rem', minHeight: '36px', height: '36px', fontSize: '0.85rem' }}
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
