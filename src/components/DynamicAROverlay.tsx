
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface DynamicAROverlayProps {
  mode: 'swing' | 'green' | 'lie';
}

export default function DynamicAROverlay({ mode }: DynamicAROverlayProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Modulate based on device tilt if available
      if (e.beta !== null && e.gamma !== null) {
        setTilt({
          x: (e.gamma / 45) * 20, // max 20px shift
          y: (e.beta / 90) * 20
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="w-full h-full opacity-60" viewBox="0 0 400 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c9964a" stopOpacity="0" />
            <stop offset="50%" stopColor="#c9964a" stopOpacity="1" />
            <stop offset="100%" stopColor="#c9964a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 3D Perspective Grid */}
        <g style={{ transform: `translate(${tilt.x}px, ${tilt.y}px)` }} className="transition-transform duration-300 ease-out">
          {/* Vanishing point lines */}
          <line x1="200" y1="300" x2="-200" y2="1200" stroke="url(#lineGrad)" strokeWidth="0.5" />
          <line x1="200" y1="300" x2="600" y2="1200" stroke="url(#lineGrad)" strokeWidth="0.5" />
          
          {/* Horizontal "Rhythm" lines */}
          {[...Array(8)].map((_, i) => (
            <motion.line
              key={`h-line-${i}`}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.1, 0.4, 0.1],
                y1: [400 + i * 50, 410 + i * 50, 400 + i * 50] 
              }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
              x1="0" y1={400 + i * 50} x2="400" y2={400 + i * 50} 
              stroke="#c9964a" strokeWidth="0.2" 
            />
          ))}

          {/* Main Alignment Line (Target Line) */}
          <motion.line 
            animate={{ strokeDashoffset: [0, -20] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            x1="200" y1="300" x2="200" y2="900" 
            stroke="#c9964a" strokeWidth="2" strokeDasharray="4 4" 
          />

          {/* Swing Plane Guide (Conditional) */}
          {mode === 'swing' && (
            <motion.path 
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.4 }}
              d="M 50,700 Q 200,300 350,700"
              fill="none"
              stroke="#c9964a"
              strokeWidth="1"
            />
          )}

          {/* Green Contours (Conditional) */}
          {mode === 'green' && (
            <g>
              {[...Array(5)].map((_, i) => (
                <motion.ellipse 
                  key={`contour-${i}`}
                  cx="200" cy="500" rx={50 + i * 30} ry={20 + i * 12}
                  fill="none"
                  stroke="#c9964a"
                  strokeWidth="0.5"
                  strokeOpacity="0.2"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                />
              ))}
            </g>
          )}
        </g>
      </svg>

      {/* Dynamic Data Labels */}
      <div className="absolute top-1/4 right-6 text-right space-y-2">
        <div className="flex flex-col">
          <span className="text-[6px] font-black text-[#c9964a] uppercase tracking-widest">Angle Attaque</span>
          <span className="text-[10px] font-mono text-white">{(4.2 + tilt.y / 10).toFixed(1)}°</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[6px] font-black text-[#c9964a] uppercase tracking-widest">Plan d'inclinaison</span>
          <span className="text-[10px] font-mono text-white">{(TiltValueToDegrees(tilt.x)).toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
}

function TiltValueToDegrees(val: number) {
  return 12.5 + val / 5;
}
