'use client';

import { useEffect, useState } from 'react';

interface GradientOrb {
  id: number;
  x: number;
  y: number;
  scale: number;
  speed: number;
  color: string;
}

export default function GradientBackground() {
  const [orbs, setOrbs] = useState<GradientOrb[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Create initial gradient orbs
    const initialOrbs: GradientOrb[] = [
      {
        id: 1,
        x: 30,
        y: 30,
        scale: 1,
        speed: 0.0002,
        color: 'rgba(147, 51, 234, 0.2)' // Purple
      },
      {
        id: 2,
        x: 70,
        y: 40,
        scale: 1.2,
        speed: 0.00015,
        color: 'rgba(236, 72, 153, 0.2)' // Pink
      },
      {
        id: 3,
        x: 40,
        y: 70,
        scale: 0.8,
        speed: 0.00025,
        color: 'rgba(167, 139, 250, 0.15)' // Indigo/purple
      },
      {
        id: 4,
        x: 60,
        y: 20,
        scale: 0.9,
        speed: 0.00022,
        color: 'rgba(124, 58, 237, 0.18)' // Violet
      }
    ];
    
    setOrbs(initialOrbs);
    
    // Fade in the gradients
    setTimeout(() => setIsVisible(true), 100);
    
    // Animate the gradients
    const animateGradients = () => {
      setOrbs(prevOrbs => 
        prevOrbs.map(orb => {
          // Calculate new positions using sine and cosine for circular motion
          // Each orb moves in a different circular pattern
          const time = Date.now() * orb.speed;
          const newX = orb.x + 10 * Math.sin(time);
          const newY = orb.y + 10 * Math.cos(time * 1.3);
          
          // Pulse the scale slightly
          const newScale = orb.scale + 0.05 * Math.sin(time * 0.5);
          
          return {
            ...orb,
            x: newX,
            y: newY,
            scale: newScale
          };
        })
      );
      
      requestAnimationFrame(animateGradients);
    };
    
    const animation = requestAnimationFrame(animateGradients);
    return () => cancelAnimationFrame(animation);
  }, []);
  
  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {orbs.map(orb => (
        <div 
          key={orb.id}
          className="absolute transition-all duration-1000 opacity-70"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: '60vw',
            height: '60vw',
            transform: `translate(-50%, -50%) scale(${orb.scale})`,
            background: `radial-gradient(circle, ${orb.color} 0%, rgba(23, 23, 23, 0) 70%)`,
            borderRadius: '50%',
          }}
        />
      ))}
      {/* Additional static ambient glow */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 60%, rgba(167, 139, 250, 0.1), rgba(23, 23, 23, 0) 70%)',
        }}
      />
    </div>
  );
} 