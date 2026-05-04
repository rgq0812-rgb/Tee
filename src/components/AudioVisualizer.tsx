import React from 'react';
import { motion } from 'motion/react';

interface AudioVisualizerProps {
  isActive: boolean;
  color?: string;
  count?: number;
}

export default function AudioVisualizer({ isActive, color = '#c9964a', count = 15 }: AudioVisualizerProps) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={`bar-${i}`}
          animate={{
            height: isActive ? [8, Math.random() * 32 + 8, 8] : 4,
            opacity: isActive ? 1 : 0.3
          }}
          transition={{
            repeat: Infinity,
            duration: 0.5 + Math.random() * 0.5,
            delay: i * 0.05
          }}
          className="w-1 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
