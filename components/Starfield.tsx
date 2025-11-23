import React, { useEffect, useRef } from 'react';

const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    let centerX = width / 2;
    let centerY = height / 2;

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      centerX = width / 2;
      centerY = height / 2;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Star properties
    const stars: { x: number; y: number; z: number }[] = [];
    const numStars = 1000; 
    const speed = 0.2; 
    
    // Initialize stars randomly in 3D space
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width // Depth
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'white';

      for (const star of stars) {
        // Move star closer
        star.z -= speed;

        // Reset star if it passes camera or goes too far
        if (star.z <= 0) {
          star.z = width;
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
        }

        // Project 3D coordinates to 2D screen
        const fov = height; 
        const scale = fov / star.z;
        const x2d = star.x * scale + centerX;
        const y2d = star.y * scale + centerY;

        // Draw star
        if (x2d > 0 && x2d < width && y2d > 0 && y2d < height) {
          const size = (1 - star.z / width) * 2.5; // Close stars are bigger
          const opacity = (1 - star.z / width); // Distant stars are dimmer
          
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(x2d, y2d, Math.max(0.1, size), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-0 mix-blend-screen opacity-80"
    />
  );
};

export default Starfield;