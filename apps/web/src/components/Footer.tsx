import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border-color)',
      padding: '2rem 0',
      marginTop: 'auto',
      color: 'var(--text-secondary)',
      fontSize: '0.9rem',
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        textAlign: 'center',
      }}>
        <p style={{ margin: 0 }}>
          Este sistema cumple con la <strong>Ley 1581 de 2012</strong> de protección de datos personales. 
          Tus datos sensibles están protegidos con cifrado de grado bancario.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Política de Privacidad</a>
          <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Lectura Fácil (Resumen)</a>
          <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Contacto de Accesibilidad</a>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Hotel Sereno. Diseñado para ofrecer una estancia tranquila y sin barreras.
        </p>
      </div>
    </footer>
  );
};
