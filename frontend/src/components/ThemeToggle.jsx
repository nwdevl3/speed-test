import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'cyberpunk';
      return 'dark';
    });
  };

  const icons = {
    dark: '🌙',
    light: '☀️',
    cyberpunk: '🎸'
  };

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: 'var(--card-bg, rgba(255,255,255,0.1))',
        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1.2rem',
        transition: 'all 0.3s ease'
      }}
      title={`Switch theme (Current: ${theme})`}
    >
      {icons[theme]}
    </button>
  );
}
