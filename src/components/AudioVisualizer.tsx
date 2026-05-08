import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  isSolar?: boolean;
  color?: string;
  count?: number;
}

export default function AudioVisualizer({ isActive, isSolar = false }: AudioVisualizerProps) {
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
        // Dynamic target height
        const target = isActive 
          ? Math.random() * height * 0.95 
          : (Math.sin(Date.now() / 800 + i / 5) * (height * 0.2) + (height * 0.1));
        
        if (!frequencies[i]) frequencies[i] = 0;
        frequencies[i] += (target - frequencies[i]) * 0.15;

        const h = frequencies[i];
        const x = i * totalBarWidth;
        
        // Luxury Neural Palette
        const gradient = ctx.createLinearGradient(x, height, x, height - h);
        
        if (isSolar) {
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');   
          gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)'); 
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');    
        } else {
          gradient.addColorStop(0, 'rgba(40, 30, 10, 0)');   
          gradient.addColorStop(0.4, 'rgba(133, 100, 36, 0.5)'); 
          gradient.addColorStop(1, 'rgba(255, 204, 51, 0.8)');    
        }

        // Shadow/Glow effect
        ctx.shadowBlur = isActive ? (isSolar ? 0 : 20) : (isSolar ? 0 : 5);
        ctx.shadowColor = isSolar ? 'transparent' : 'rgba(255, 204, 51, 0.6)';
        
        ctx.fillStyle = gradient;
        
        // Drawing bars with slight round on top
        ctx.beginPath();
        const r = 1;
        ctx.roundRect(x, height - h, barWidth, h, [r, r, 0, 0]);
        ctx.fill();
        
        // Reset shadow for next bar performance
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationRef.current);
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
