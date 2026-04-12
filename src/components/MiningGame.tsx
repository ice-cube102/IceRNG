import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pickaxe, Gem, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MiningGameProps {
  pickaxeLevel: number;
  processingLevel: number;
  oreLuckLevel: number;
  onMine: (fragments: Record<string, number>) => void;
}

const FRAGMENT_TYPES = ['Basic fragment', 'Rare fragment', 'Epic fragment', 'Legendary fragment', 'Mythical fragment'];

export function MiningGame({ pickaxeLevel, processingLevel, oreLuckLevel, onMine }: MiningGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [notes, setNotes] = useState<{ id: number; position: number; type: number }[]>([]);
  const requestRef = useRef<number>();
  const lastNoteTime = useRef<number>(0);
  const noteIdCounter = useRef<number>(0);

  const difficultyReduction = Math.min(0.6, processingLevel * 0.05);
  const baseSpeed = 2 + (score * 0.05);
  const speed = baseSpeed * (1 - difficultyReduction);
  const spawnRate = Math.max(400, 1000 - (score * 10) + (difficultyReduction * 500));

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setHealth(100);
    setNotes([]);
    lastNoteTime.current = Date.now();
  };

  const stopGame = useCallback(() => {
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    // Calculate rewards based on score
    if (score > 0) {
      const damageMult = 1 + (pickaxeLevel * 0.5);
      const luckMult = 1 + (oreLuckLevel * 0.1);
      
      const fragments: Record<string, number> = {
        'Basic fragment': 0,
        'Rare fragment': 0,
        'Epic fragment': 0,
        'Legendary fragment': 0,
        'Mythical fragment': 0
      };

      const totalRolls = Math.floor(score * damageMult);
      
      for (let i = 0; i < totalRolls; i++) {
        const roll = Math.random();
        // Adjust probabilities based on luck
        const mythicProb = 0.001 * luckMult;
        const legendProb = 0.01 * luckMult;
        const epicProb = 0.05 * luckMult;
        const rareProb = 0.2 * luckMult;

        if (roll < mythicProb) fragments['Mythical fragment']++;
        else if (roll < legendProb) fragments['Legendary fragment']++;
        else if (roll < epicProb) fragments['Epic fragment']++;
        else if (roll < rareProb) fragments['Rare fragment']++;
        else fragments['Basic fragment']++;
      }

      onMine(fragments);
      toast.success(`채굴 완료! 점수: ${score}`);
    }
  }, [score, pickaxeLevel, oreLuckLevel, onMine]);

  const updateGame = useCallback(() => {
    if (!isPlaying) return;

    const now = Date.now();
    
    // Spawn new notes
    if (now - lastNoteTime.current > spawnRate) {
      setNotes(prev => [...prev, { 
        id: noteIdCounter.current++, 
        position: 0,
        type: Math.floor(Math.random() * 3) // 3 lanes
      }]);
      lastNoteTime.current = now;
    }

    // Move notes
    setNotes(prev => {
      const newNotes = prev.map(note => ({ ...note, position: note.position + speed }));
      
      // Check for missed notes
      const missed = newNotes.filter(note => note.position > 100);
      if (missed.length > 0) {
        setHealth(h => {
          const newHealth = h - (missed.length * 10);
          if (newHealth <= 0) {
            setTimeout(stopGame, 0);
            return 0;
          }
          return newHealth;
        });
      }

      return newNotes.filter(note => note.position <= 100);
    });

    requestRef.current = requestAnimationFrame(updateGame);
  }, [isPlaying, speed, spawnRate, stopGame]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, updateGame]);

  const hitNote = (lane: number) => {
    if (!isPlaying) return;

    setNotes(prev => {
      // Find the lowest note in the lane
      const laneNotes = prev.filter(n => n.type === lane);
      if (laneNotes.length === 0) return prev;

      const lowestNote = laneNotes.reduce((prev, current) => (prev.position > current.position) ? prev : current);

      // Check if it's in the hit zone (e.g., 80% to 100%)
      if (lowestNote.position > 75 && lowestNote.position < 95) {
        setScore(s => s + 1);
        // Play hit effect here if needed
        return prev.filter(n => n.id !== lowestNote.id);
      } else if (lowestNote.position > 95) {
        // Too late, handled by miss logic
        return prev;
      } else {
        // Too early, penalty
        setHealth(h => Math.max(0, h - 5));
        return prev;
      }
    });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') hitNote(0);
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') hitNote(1);
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') hitNote(2);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, hitNote]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-[400px] bg-slate-950 rounded-3xl border border-slate-800 relative overflow-hidden">
      {!isPlaying ? (
        <div className="flex flex-col items-center gap-6">
          <Pickaxe className="w-16 h-16 text-slate-400" />
          <div className="text-center">
            <h3 className="text-2xl font-black text-white mb-2">광석 채굴</h3>
            <p className="text-slate-400 text-sm">떨어지는 돌멩이를 타이밍에 맞춰 클릭하세요.</p>
            <p className="text-slate-500 text-xs mt-1">단축키: A, S, D 또는 방향키(좌, 하, 우)</p>
          </div>
          <Button 
            onClick={startGame}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl text-lg"
          >
            채굴 시작
          </Button>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col">
          <div className="flex justify-between items-center p-4 bg-slate-900/80 border-b border-slate-800">
            <div className="text-emerald-400 font-bold text-xl">Score: {score}</div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-4 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${health > 50 ? 'bg-emerald-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${health}%` }}
                />
              </div>
              <span className="text-slate-400 text-xs">{Math.ceil(health)}%</span>
            </div>
            <Button variant="ghost" size="sm" onClick={stopGame} className="text-red-400 hover:text-red-300 hover:bg-red-900/30">
              중지
            </Button>
          </div>
          
          <div className="flex-1 relative flex">
            {/* Lanes */}
            {[0, 1, 2].map(lane => (
              <div key={lane} className="flex-1 border-r border-slate-800/50 last:border-r-0 relative">
                {/* Hit Zone */}
                <div className="absolute bottom-4 left-2 right-2 h-16 border-2 border-slate-700 rounded-xl bg-slate-800/30" />
                
                {/* Notes */}
                {notes.filter(n => n.type === lane).map(note => (
                  <div 
                    key={note.id}
                    className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-400 rounded-lg shadow-[0_0_15px_rgba(148,163,184,0.5)] flex items-center justify-center"
                    style={{ top: `${note.position}%` }}
                  >
                    <Gem className="w-6 h-6 text-slate-800" />
                  </div>
                ))}

                {/* Click Area */}
                <button 
                  className="absolute bottom-0 left-0 w-full h-32 outline-none hover:bg-white/5 active:bg-white/10 transition-colors"
                  onMouseDown={() => hitNote(lane)}
                  onTouchStart={(e) => { e.preventDefault(); hitNote(lane); }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
