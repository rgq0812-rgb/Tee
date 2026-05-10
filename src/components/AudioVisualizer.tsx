import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  mode?: 'listening' | 'thinking' | 'speaking' | 'idle';
  isSolar?: boolean;
  color?: string;
  count?: number;
}

export default function AudioVisualizer({ isActive, mode = 'idle', isSolar = false }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays and resizing to fill parent CONTAINER
    const resize = () => {
      const { clientWidth, clientHeight } = container;
      canvas.width = clientWidth * window.devicePixelRatio;
      canvas.height = clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const frequencies = new Array(300).fill(0);
    let animationFrame: number;
    let startTime = Date.now();

    const render = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      ctx.clearRect(0, 0, width, height);

      // Gold Neural Bars - Luxury Specs
      const barWidth = 4;
      const gap = 2;
      const totalBarWidth = barWidth + gap;
      const barCount = Math.floor(width / totalBarWidth);

      for (let i = 0; i < barCount; i++) {
        // Sophisticated Synthetic "Neural" Animation
        // Combined sine waves to look like real voice activity
        const time = (Date.now() - startTime) / 1000;
        let target = 0;
        
        if (mode === 'listening') {
          // Energetic, reactive to recent voice
          const wave1 = Math.sin(time * 15 + i * 0.3) * 0.4 + 0.5;
          const wave2 = Math.sin(time * 30 - i * 0.6) * 0.3 + 0.3;
          const noise = Math.random() * 0.4;
          target = (wave1 * 0.5 + wave2 * 0.3 + noise) * height * 1.8;
          if (Math.random() > 0.97) target *= 2; 
        } else if (mode === 'speaking') {
          // Rhythmic, authoritative like a voice
          const base = Math.sin(time * 12 + i * 0.1) * 0.5 + 0.5;
          const detail = Math.sin(time * 40 + i * 0.4) * 0.2;
          target = (base + detail) * height * 1.4;
        } else if (mode === 'thinking') {
          // Slow, deep pulsing waves
          const pulse = Math.sin(time * 3 + i * 0.05) * 0.5 + 0.5;
          target = pulse * height * 0.8;
        } else {
          // Calm background pulse
          target = (Math.sin(time * 2 + i / 5) * (height * 0.15) + (height * 0.1));
        }
        
        if (!frequencies[i]) frequencies[i] = 0;
        const smoothing = mode !== 'idle' ? 0.2 : 0.1;
        frequencies[i] += (target - frequencies[i]) * smoothing;

        const h = Math.max(1, frequencies[i]);
        const x = i * totalBarWidth;
        
        const gradient = ctx.createLinearGradient(x, height, x, height - h);
        
        if (isSolar) {
          gradient.addColorStop(0, 'rgba(201, 150, 74, 0)');   
          gradient.addColorStop(0.5, 'rgba(201, 150, 74, 0.2)'); 
          gradient.addColorStop(1, 'rgba(201, 150, 74, 0.4)');    
        } else {
          gradient.addColorStop(0, 'rgba(201, 150, 74, 0)');   
          gradient.addColorStop(0.4, 'rgba(201, 150, 74, 0.2)'); 
          gradient.addColorStop(1, 'rgba(201, 150, 74, 0.3)');    
        }

        ctx.shadowBlur = isActive ? (isSolar ? 0 : 15) : 0;
        ctx.shadowColor = isSolar ? 'transparent' : 'rgba(201, 150, 74, 0.1)';
        
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        const r = 1;
        ctx.roundRect(x, height - h, barWidth, h, [r, r, 0, 0]);
        ctx.fill();
        
        ctx.shadowBlur = 0;
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [isActive, isSolar]);

  return (
    <div ref={containerRef} className="w-full h-full relative group pointer-events-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}
