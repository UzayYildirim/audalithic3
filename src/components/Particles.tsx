'use client';

import { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  opacity: number;
  color: string;
  pulseSpeed: number;
  pulsePhase: number;
}

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  // Generate initial particles
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set dimensions
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateDimensions();
    
    // Generate particles
    const particleCount = 15; // Reduced number of particles
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2.5 + 1.5, // Slightly smaller size: 1.5-4px
        speed: Math.random() * 0.3 + 0.1, // Slower movement
        angle: Math.random() * 360 * (Math.PI / 180),
        opacity: Math.random() * 0.4 + 0.2, // Reduced opacity
        color: getRandomColor(),
        pulseSpeed: Math.random() * 0.003 + 0.001, // Slower pulse
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    particlesRef.current = newParticles;
    
    // Fade in
    const timer = setTimeout(() => setIsVisible(true), 300);
    
    // Update dimensions on resize
    window.addEventListener('resize', updateDimensions);
    
    // Start animation
    startAnimation();
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timer);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Update canvas size when dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
  }, [dimensions]);

  // Random color generator
  function getRandomColor() {
    const colors = [
      'rgba(147, 51, 234, 0.7)', // Purple
      'rgba(236, 72, 153, 0.7)', // Pink
      'rgba(167, 139, 250, 0.7)', // Indigo
      'rgba(124, 58, 237, 0.7)', // Violet
      'rgba(139, 92, 246, 0.7)', // Purple medium
      'rgba(192, 132, 252, 0.7)', // Purple light
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function startAnimation() {
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Move particle
        const newX = particle.x + Math.cos(particle.angle) * particle.speed;
        const newY = particle.y + Math.sin(particle.angle) * particle.speed;
        
        // Check boundaries and wrap around
        particle.x = newX < 0 ? canvas.width : newX > canvas.width ? 0 : newX;
        particle.y = newY < 0 ? canvas.height : newY > canvas.height ? 0 : newY;
        
        // Update pulse phase
        particle.pulsePhase = (particle.pulsePhase + particle.pulseSpeed) % (Math.PI * 2);
        
        // Calculate pulsing size and opacity
        const pulseSize = particle.size * (1 + 0.15 * Math.sin(particle.pulsePhase)); // Reduced pulse size
        const pulseOpacity = particle.opacity * (0.8 + 0.2 * Math.sin(particle.pulsePhase)); // Reduced pulse opacity range
        
        // Draw glow effect
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, pulseSize * 4 // Reduced glow size
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = pulseOpacity * 0.3; // Reduced glow opacity
        ctx.fill();
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = pulseOpacity;
        ctx.fill();
        
        // Slightly change direction occasionally
        if (Math.random() > 0.997) { // Less frequent direction changes
          particle.angle += (Math.random() * 0.15 - 0.075); // Smaller direction changes
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }

  return (
    <canvas 
      ref={canvasRef}
      className={`particle-canvas transition-opacity duration-1500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    />
  );
} 