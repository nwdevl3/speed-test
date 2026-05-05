import { useRef, useEffect } from 'react';

export default function ParticleBackground({ activeSpeed = 0 }) {
  const canvasRef = useRef(null);
  const streaksRef = useRef([]);
  const animRef = useRef(null);

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

    // Create streaks
    const count = 80;
    streaksRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: 10 + Math.random() * 40,
      speed: 0.5 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.3,
      hue: Math.random() > 0.5 ? 180 : 260, // Cyan or Purple
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Speed multiplier based on active speed
      const boost = Math.min(activeSpeed / 50, 10);
      
      streaksRef.current.forEach((s) => {
        const currentSpeed = s.speed + boost;
        s.y += currentSpeed;
        
        // Wrap around
        if (s.y > canvas.height + 50) {
          s.y = -50;
          s.x = Math.random() * canvas.width;
        }

        const gradient = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.len + boost * 2);
        gradient.addColorStop(0, `hsla(${s.hue}, 100%, 70%, 0)`);
        gradient.addColorStop(1, `hsla(${s.hue}, 100%, 70%, ${s.opacity})`);

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
