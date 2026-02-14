import React from 'react';
import { motion } from 'framer-motion';
import { Level, User } from '../../types';
import { Star, Lock, Check, Trophy, BookOpen, BrainCircuit } from 'lucide-react';

interface LevelNodeProps {
  level: Level;
  x: number; // Percentage 0-100
  y: number; // Absolute pixels from top
  onClick: (level: Level) => void;
  peers: User[];
}

export const LevelNode: React.FC<LevelNodeProps> = ({ level, x, y, onClick, peers }) => {
  const isLocked = level.status === 'locked';
  const isCompleted = level.status === 'completed';
  const isCurrent = level.status === 'unlocked';

  // Determine Icon
  const Icon = level.type === 'boss' ? Trophy : level.type === 'quiz' ? BrainCircuit : BookOpen;

  return (
    <div 
      className="absolute flex flex-col items-center justify-center w-24 h-24 transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${x}%`, top: y }}
    >
      {/* Node Button */}
      <motion.button
        whileHover={{ scale: isLocked ? 1 : 1.1, y: isLocked ? 0 : -5 }}
        whileTap={{ scale: isLocked ? 1 : 0.95 }}
        onClick={() => !isLocked && onClick(level)}
        className={`
          relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-colors duration-300
          ${isCompleted ? 'bg-green-500 text-white ring-4 ring-green-200' : ''}
          ${isCurrent ? 'bg-primary-600 text-white ring-4 ring-primary-200 animate-pulse' : ''}
          ${isLocked ? 'bg-gray-200 text-gray-400 ring-4 ring-gray-100 cursor-not-allowed' : ''}
        `}
      >
        {isLocked ? <Lock size={20} /> : isCompleted ? <Check size={28} strokeWidth={3} /> : <Icon size={24} />}
        
        {/* Stars for completed levels */}
        {isCompleted && level.stars > 0 && (
          <div className="absolute -bottom-2 flex gap-0.5">
            {[...Array(3)].map((_, i) => (
              <Star 
                key={i} 
                size={12} 
                className={`${i < level.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
              />
            ))}
          </div>
        )}
      </motion.button>

      {/* Level Title Label */}
      <div className={`
        mt-3 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-sm transition-opacity
        ${isCurrent ? 'bg-white/90 text-primary-700 opacity-100' : 'bg-white/60 text-gray-600 opacity-80'}
      `}>
        {level.title}
      </div>

      {/* Peer Avatars */}
      {peers.length > 0 && (
        <div className="absolute -right-8 top-0 flex flex-col -space-y-2">
          {peers.map((peer) => (
            <motion.img
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={peer.id}
              src={peer.avatar}
              alt={peer.name}
              className="w-8 h-8 rounded-full border-2 border-white shadow-md z-20"
              title={`${peer.name} is here`}
            />
          ))}
        </div>
      )}
    </div>
  );
};


import React, { useMemo, useRef, useState, useEffect } from 'react';
import { MOCK_LEVELS, getPeersOnLevel } from '../../services/mockStore';
import { LevelNode } from './LevelNode';
import { Level } from '../../types';
import { motion, useScroll, useTransform } from 'framer-motion';

interface TrackViewProps {
  onLevelSelect: (level: Level) => void;
}

export const TrackView: React.FC<TrackViewProps> = ({ onLevelSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track parameters
  const nodeSpacing = 160;
  const amplitude = 30; // Percentage of width
  const frequency = 0.5;
  const verticalPadding = 100;

  // Calculate coordinates for path and nodes
  const trackData = useMemo(() => {
    return MOCK_LEVELS.map((level, index) => {
      // Create a winding path using Sine wave
      // Flip direction every few nodes for variety or keep simple sine
      const y = index * nodeSpacing + verticalPadding;
      // Map x from -1 to 1 to percentage (20% to 80%)
      const xNorm = Math.sin(index * frequency); 
      const x = 50 + (xNorm * amplitude); 
      return { ...level, calculatedX: x, calculatedY: y };
    });
  }, []);

  const totalHeight = trackData.length * nodeSpacing + verticalPadding * 2;

  // Generate SVG Path string
  const pathString = useMemo(() => {
    if (trackData.length === 0) return "";
    let d = `M ${trackData[0].calculatedX}% ${trackData[0].calculatedY}`;
    
    for (let i = 0; i < trackData.length - 1; i++) {
      const current = trackData[i];
      const next = trackData[i + 1];
      
      const midY = (current.calculatedY + next.calculatedY) / 2;
      const cp1x = current.calculatedX;
      const cp1y = midY;
      const cp2x = next.calculatedX;
      const cp2y = midY;
      
      // Bezier curve for smooth connection
      // We use absolute pixel values for Y but percentages for X? 
      // SVG needs consistent units. Let's assume standard width of 1000 units for SVG coord system for X.
      // But we are rendering in HTML flow. 
      // Better approach: Position absolute divs for nodes, and an SVG behind them that scales.
      // We will render SVG with viewbox 0 0 100 height.
    }
    
    // Simpler approach for React SVG path with mixed units:
    // We'll just generate a curve using percentages for X and pixels for Y? No.
    // Let's rely on fixed width assumptions or use a purely pixel based calculation for the SVG.
    // Let's assume container width is roughly responsive but we treat the center as x=500 (in a 1000 wide viewbox).
    
    let path = `M ${trackData[0].calculatedX * 10} ${trackData[0].calculatedY}`;
    for (let i = 0; i < trackData.length - 1; i++) {
        const curr = trackData[i];
        const next = trackData[i+1];
        const cX = curr.calculatedX * 10;
        const cY = curr.calculatedY;
        const nX = next.calculatedX * 10;
        const nY = next.calculatedY;
        
        // Control points
        const cp1x = cX;
        const cp1y = cY + (nodeSpacing / 2);
        const cp2x = nX;
        const cp2y = nY - (nodeSpacing / 2);
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nX} ${nY}`;
    }
    return path;
  }, [trackData]);

  // Scroll to current level on mount
  useEffect(() => {
    const currentLevel = trackData.find(l => l.status === 'unlocked');
    if (currentLevel && containerRef.current) {
        // Simple timeout to allow render
        setTimeout(() => {
             window.scrollTo({
                 top: currentLevel.calculatedY - window.innerHeight / 2,
                 behavior: 'smooth'
             });
        }, 100);
    }
  }, [trackData]);

  return (
    <div className="relative w-full min-h-screen bg-slate-50 overflow-hidden" ref={containerRef} style={{ height: totalHeight + 200 }}>
       {/* Background Aesthetics */}
       <div className="fixed inset-0 pointer-events-none opacity-30">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent"></div>
           <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl"></div>
       </div>

      {/* SVG Path Layer */}
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
        viewBox={`0 0 1000 ${totalHeight}`}
        preserveAspectRatio="none"
      >
        {/* Outer Stroke */}
        <path 
            d={pathString} 
            fill="none" 
            stroke="#E2E8F0" 
            strokeWidth="24" 
            strokeLinecap="round"
        />
        {/* Inner Progress Stroke (Dashed for future, solid for past) */}
        <path 
            d={pathString} 
            fill="none" 
            stroke="#CBD5E1" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray="20 10"
        />
        {/* Animated Active Path (Optional - just doing simple for now) */}
      </svg>

      {/* Nodes Layer */}
      <div className="absolute top-0 left-0 w-full h-full z-10">
        {trackData.map((level) => (
          <LevelNode 
            key={level.id}
            level={level}
            x={level.calculatedX}
            y={level.calculatedY}
            onClick={onLevelSelect}
            peers={getPeersOnLevel(level.id)}
          />
        ))}
      </div>
      
      {/* Start/End Indicators */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-slate-400 font-bold tracking-widest uppercase text-sm" style={{ top: 40 }}>
        Start Journey
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { TrackView } from './components/track/TrackView';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { AiAssistant } from './components/ai/AiAssistant';
import { QuizModal } from './components/quiz/QuizModal';
import { CURRENT_USER } from './services/mockStore';
import { Level } from './types';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [user, setUser] = useState(CURRENT_USER);

  const handleLevelSelect = (level: Level) => {
    setActiveLevel(level);
  };

  const handleQuizComplete = (score: number) => {
    // Optimistic update
    if (activeLevel) {
        // In a real app, update DB here
        setUser(prev => ({ ...prev, xp: prev.xp + (score * 50) }));
    }
    setActiveLevel(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <main className="flex-1 pt-16 flex relative overflow-hidden">
        {/* Main Track Area */}
        <div className="flex-1 relative overflow-y-auto no-scrollbar">
            <TrackView onLevelSelect={handleLevelSelect} />
        </div>

        {/* Desktop Sidebar (Right) */}
        <div className="hidden lg:block w-80 bg-white border-l border-gray-200 h-[calc(100vh-64px)] fixed right-0 top-16 z-20 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
            <StudentDashboard user={user} />
        </div>
        
        {/* Mobile Sidebar */}
        <AnimatePresence>
            {sidebarOpen && (
                <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 lg:hidden pt-16"
                >
                     <StudentDashboard user={user} />
                     <button 
                        onClick={() => setSidebarOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"
                     >
                         ✕
                     </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Global Components */}
        <AiAssistant />
        
        <AnimatePresence>
            {activeLevel && (
                <QuizModal 
                    level={activeLevel} 
                    onClose={() => setActiveLevel(null)} 
                    onComplete={handleQuizComplete} 
                />
            )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default App;