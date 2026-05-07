import { useRef, useEffect } from 'react';

// Helper to convert hex or CSS variable to hue
function resolveColor(color) {
  if (color.startsWith('var')) {
    const varName = color.slice(4, -1);
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return resolved || '#334155';
  }
  return color;
}

function hexToHue(hex) {
  const color = resolveColor(hex);
  if (!color || !color.startsWith('#')) return 180;
  let r = 0, g = 0, b = 0;
  if (color.length === 4) {
    r = parseInt(color[1] + color[1], 16);
    g = parseInt(color[2] + color[2], 16);
    b = parseInt(color[3] + color[3], 16);
  } else {
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return h * 360;
}

export default function ParticleBackground({ activeSpeed = 0, themeColor = '#334155' }) {
  const canvasRef = useRef(null);
  const streaksRef = useRef([]);
  const animRef = useRef(null);
  const targetHueRef = useRef(180);
  const currentHueRef = useRef(180);

  useEffect(() => {
    targetHueRef.current = hexToHue(themeColor);
  }, [themeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const count = 80;
    streaksRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: 10 + Math.random() * 40,
      speed: 0.5 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.3,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Smoothly transition the current hue toward the target hue
      currentHueRef.current += (targetHueRef.current - currentHueRef.current) * 0.05;

      const boost = Math.min(activeSpeed / 50, 10);
      
      streaksRef.current.forEach((s) => {
        const currentSpeed = s.speed + boost;
        s.y += currentSpeed;
        
        if (s.y > canvas.height + 50) {
          s.y = -50;
          s.x = Math.random() * canvas.width;
        }

        const gradient = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.len + boost * 2);
        gradient.addColorStop(0, `hsla(${currentHueRef.current}, 100%, 70%, 0)`);
        gradient.addColorStop(1, `hsla(${currentHueRef.current}, 100%, 70%, ${s.opacity})`);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + boost * 0.1;
        ctx.lineCap = 'round';
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y + s.len + boost * 2);
        ctx.stroke();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [activeSpeed]);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}
