import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

// Renders nothing visible (canvas-confetti draws to its own canvas),
// but keeps a lifecycle to trigger a unique multi-burst celebration.
const ConfettiBurst = ({ durationMs = 2500, intensity = 0.9, onDone }) => {
  const [running, setRunning] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;

    const end = Date.now() + durationMs;

    const colors = ['#a78bfa', '#60a5fa', '#34d399', '#f59e0b', '#f472b6'];

    const frame = () => {
      const timeLeft = end - Date.now();
      if (timeLeft <= 0) {
        setRunning(false);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone && onDone();
        }
        return;
      }

      const particleCount = Math.round(50 * (timeLeft / durationMs) * intensity);

      // Twin bursts from left and right
      confetti({
        particleCount,
        angle: 60,
        spread: 75,
        origin: { x: 0 },
        colors,
        ticks: 180
      });
      confetti({
        particleCount,
        angle: 120,
        spread: 75,
        origin: { x: 1 },
        colors,
        ticks: 180
      });

      // Occasional star burst center
      if (Math.random() > 0.6) {
        confetti({
          particleCount: Math.max(25, Math.floor(particleCount / 2)),
          spread: 360,
          startVelocity: 45,
          scalar: 0.8,
          origin: { x: 0.5, y: 0.4 },
          colors
        });
      }

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);

    return () => {
      doneRef.current = true;
      setRunning(false);
    };
  }, [durationMs, intensity, onDone]);

  // Invisible overlay ensures proper stacking context
  return (
    <div className="fixed inset-0 pointer-events-none z-[60]" aria-hidden={!running} />
  );
};

export default ConfettiBurst;
