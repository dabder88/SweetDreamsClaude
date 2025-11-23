import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterEffectProps {
  content: string;
  speed?: number;
  onComplete?: () => void;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({ 
  content, 
  speed = 15, 
  onComplete 
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const indexRef = useRef(0);
  // Use ReturnType<typeof setInterval> to support both browser (number) and Node (Timeout) environments without assuming global types
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset if content changes drastically (new analysis)
    setDisplayedContent('');
    indexRef.current = 0;
    
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (indexRef.current < content.length) {
        // Take a chunk of characters to make it smoother and faster for long texts
        const chunkSize = 3; 
        const nextIndex = Math.min(indexRef.current + chunkSize, content.length);
        const slice = content.slice(indexRef.current, nextIndex);
        
        setDisplayedContent((prev) => prev + slice);
        indexRef.current = nextIndex;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [content, speed, onComplete]);

  return (
    <div className="prose prose-indigo prose-lg max-w-none animate-fade-in">
      <ReactMarkdown>{displayedContent}</ReactMarkdown>
      <span className="inline-block w-2 h-5 bg-indigo-500 ml-1 animate-pulse align-middle"></span>
    </div>
  );
};

export default TypewriterEffect;