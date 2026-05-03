'use client';
import { useEffect, useState } from 'react';

interface Piece {
  id: number;
  x: number; y: number;
  dx: number; dy: number;
  rot: number;
  color: string;
}

const COLORS = ['var(--terracotta)', 'var(--sage)', 'var(--butter)', 'var(--plum)', 'var(--sky)'];

export default function Confetti({ trigger }: { trigger: { x: number; y: number; t: number } | null }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const newPieces: Piece[] = Array.from({ length: 18 }, (_, i) => ({
      id: trigger.t + i,
      x: trigger.x, y: trigger.y,
      dx: (Math.random() - 0.5) * 220,
      dy: -Math.random() * 190 - 40,
      rot: Math.random() * 360,
      color: COLORS[i % COLORS.length],
    }));
    setPieces(p => [...p, ...newPieces]);
    const id = setTimeout(() => setPieces(p => p.filter(x => !newPieces.find(n => n.id === x.id))), 1100);
    return () => clearTimeout(id);
  }, [trigger]);

  return (
    <>
      {pieces.map(p => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.x, top: p.y,
            width: 8, height: 12,
            background: p.color,
            transform: `rotate(${p.rot}deg)`,
            animation: `confetti-fly-${p.id} 1s cubic-bezier(0.2,0.6,0.2,1) forwards`,
          }}
        >
          <style>{`@keyframes confetti-fly-${p.id} { to { transform: translate(${p.dx}px,${p.dy + 210}px) rotate(${p.rot + 360}deg); opacity: 0; } }`}</style>
        </span>
      ))}
    </>
  );
}
