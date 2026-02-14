"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Lock, Check, Trophy, BookOpen, BrainCircuit, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrackLevel {
  id: string;
  title: string;
  type: string;
  status: "locked" | "unlocked" | "completed";
  stars: number;
  position: number;
}

interface LevelNodeProps {
  level: TrackLevel;
  x: number; // Percentage 0-100
  y: number; // Absolute pixels from top
  onClick: (level: TrackLevel) => void;
  peers?: { id: string; name: string; avatar?: string }[];
}

const LevelNode: React.FC<LevelNodeProps> = ({ level, x, y, onClick, peers = [] }) => {
  const isLocked = level.status === "locked";
  const isCompleted = level.status === "completed";
  const isCurrent = level.status === "unlocked";

  // Determine Icon
  const Icon = level.type === "boss" ? Trophy : level.type === "quiz" ? BrainCircuit : BookOpen;

  return (
    <div
      className="absolute flex flex-col items-center justify-center w-32 h-32 transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${x}%`, top: y }}
    >
      {/* Node Button */}
      {/* Hand-Drawn Design: Wobbly border, hard shadow, rotate on hover */}
      <motion.button
        whileHover={{ scale: isLocked ? 1 : 1.1, rotate: isLocked ? 0 : -3 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => !isLocked && onClick(level)}
        className={cn(
          "relative flex items-center justify-center w-20 h-20 transition-all duration-300",
          "rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-[3px] border-foreground", // Wobbly shape
          
          isCompleted && "bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_#2d2d2d] hover:shadow-[2px_2px_0px_0px_#2d2d2d]",
          isCurrent && "bg-accent text-accent-foreground shadow-[6px_6px_0px_0px_#2d2d2d] animate-pulse ring-4 ring-accent/20",
          isLocked && "bg-muted text-muted-foreground border-dashed cursor-not-allowed opacity-80 shadow-none border-2"
        )}
      >
        {isLocked ? (
          <Lock size={24} />
        ) : isCompleted ? (
          <Check size={32} strokeWidth={3} />
        ) : (
          <Play size={28} fill="currentColor" className="ml-1" />
        )}

        {/* Stars for completed levels */}
        {isCompleted && level.stars > 0 && (
          <div className="absolute -bottom-3 flex gap-1 z-20">
            {[...Array(3)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={cn(
                  "drop-shadow-sm",
                  i < level.stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"
                )}
              />
            ))}
          </div>
        )}
      </motion.button>

      {/* Level Title Label */}
      <div 
        className={cn(
            "mt-4 px-3 py-1 text-sm font-heading font-bold border-2 border-foreground bg-background shadow-[2px_2px_0px_0px_#2d2d2d] rotate-1 transition-opacity z-20 whitespace-nowrap",
            isLocked ? "opacity-50" : "opacity-100",
            "rounded-[25px_50px_25px_50px/50px_25px_50px_25px]" // Wobbly Md
        )}
      >
        {level.title}
      </div>
      
      {/* Peer Avatars (Simplified for now) */}
      {peers.map((peer, i) => (
          <div key={peer.id} className="absolute -right-4 -top-2 w-8 h-8 rounded-full border-2 border-foreground bg-white overflow-hidden shadow-sm z-30 transform hover:scale-110 transition-transform">
              {/* Avatar placeholder */}
              <div className="w-full h-full flex items-center justify-center bg-secondary text-[10px] font-bold">
                  {peer.name.charAt(0)}
              </div>
          </div>
      ))}
    </div>
  );
};

interface TrackViewProps {
  levels: TrackLevel[];
  onLevelSelect: (level: TrackLevel) => void;
}

export const TrackView: React.FC<TrackViewProps> = ({ levels, onLevelSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track layout parameters
  const nodeSpacing = 180;
  const amplitude = 35; // Percentage of width
  const frequency = 0.6;
  const verticalPadding = 150;

  // Calculate coordinates
  const trackData = useMemo(() => {
    return levels.map((level, index) => {
      const y = index * nodeSpacing + verticalPadding;
      // Zigzag / Sine wave logic
      const xNorm = Math.sin(index * frequency);
      const x = 50 + xNorm * amplitude;
      return { ...level, calculatedX: x, calculatedY: y };
    });
  }, [levels]);

  const totalHeight = Math.max(800, trackData.length * nodeSpacing + verticalPadding * 2);

  // SVG Path Generation
  const pathString = useMemo(() => {
    if (trackData.length === 0) return "";
    
    // Start logic
    let path = `M ${trackData[0].calculatedX * 10} ${trackData[0].calculatedY}`;
    
    for (let i = 0; i < trackData.length - 1; i++) {
        const curr = trackData[i];
        const next = trackData[i+1];
        
        const cX = curr.calculatedX * 10;
        const cY = curr.calculatedY;
        const nX = next.calculatedX * 10;
        const nY = next.calculatedY;
        
        // Control points for smooth curve
        const cp1x = cX;
        const cp1y = cY + (nodeSpacing / 2);
        const cp2x = nX;
        const cp2y = nY - (nodeSpacing / 2);
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nX} ${nY}`;
    }
    return path;
  }, [trackData]);

  // Scroll to current level
  useEffect(() => {
    const currentLevel = trackData.find((l) => l.status === "unlocked");
    if (currentLevel) {
       // Simple scroll into view logic if needed
       // window.scrollTo(...)
    }
  }, [trackData]);

  if (levels.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
            <h3 className="font-heading text-2xl">This track is empty!</h3>
            <p className="text-muted-foreground font-body">Ask your teacher to add some lessons.</p>
        </div>
      );
  }

  return (
    <div 
        className="relative w-full overflow-hidden bg-background min-h-[600px]" 
        style={{ height: totalHeight }}
        ref={containerRef}
    >
      {/* Background sketch lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#2d2d2d_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* SVG Path Layer */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
        viewBox={`0 0 1000 ${totalHeight}`}
        preserveAspectRatio="none"
        style={{ minWidth: '100%' }}
      >
        {/* Outer Stroke (Hand-drawn style: thick slightly irregular) */}
        <path
          d={pathString}
          fill="none"
          stroke="var(--foreground)" // #2d2d2d
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="12 12" // Dashed line styling from design system
          className="opacity-30"
        />
      </svg>

      {/* Nodes Layer */}
      {trackData.map((level) => (
        <LevelNode
          key={level.id}
          level={level}
          x={level.calculatedX}
          y={level.calculatedY}
          onClick={onLevelSelect}
        />
      ))}
      
      <div className="absolute top-10 left-1/2 -translate-x-1/2 font-heading text-3xl text-muted-foreground/50 transform -rotate-3 select-none">
          Start Journey
      </div>
    </div>
  );
};
