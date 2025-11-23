import React from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className = '' }) => {
  // 3D logic removed per user request for a stable interface
  return (
    <div 
      className={`relative transition-all duration-300 ${className}`}
    >
       {children}
    </div>
  );
};

export default TiltCard;