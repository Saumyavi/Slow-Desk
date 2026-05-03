'use client';
import { useEffect, useRef } from 'react';

const PAL = {
  desk1: '#c9a17a', desk2: '#b08a64', desk3: '#9a7551',
  paperCream: '#f5ecd9', paperWhite: '#fbf6e8',
  ink: '#3a2f24', accent: '#c1623f', sage: '#8aa67c',
  butter: '#e6c46a', steam: '#f5ecd9',
};

export default function DeskScene({ className }: { className?: string }) {
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const t = ((ts - startRef.current) / 1000) % 8;
      timeRef.current = t;
      renderFrame(t);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function renderFrame(t: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const T = 8;
    const phase = t / T;
    const angle = phase * Math.PI * 2;
    const zoom = 1.06 + Math.sin(angle) * 0.025;
    const camX = Math.cos(angle) * 22 + Math.sin(angle * 2) * 6;
    const camY = Math.sin(angle) * 14 + Math.cos(angle * 2) * 4;

    const layer1 = svg.querySelector('#layer-deep') as SVGGElement;
    const layer2 = svg.querySelector('#layer-mid') as SVGGElement;
    const layer3 = svg.querySelector('#layer-front') as SVGGElement;

    if (layer1) layer1.setAttribute('transform', `translate(${960 + camX * 0.4} ${540 + camY * 0.4}) scale(${zoom * 0.98}) translate(-960 -540)`);
    if (layer2) layer2.setAttribute('transform', `translate(${960 + camX} ${540 + camY}) scale(${zoom}) translate(-960 -540)`);
    if (layer3) layer3.setAttribute('transform', `translate(${960 + camX * 1.6} ${540 + camY * 1.6}) scale(${zoom * 1.02}) translate(-960 -540)`);

    // Steam animation
    [0, 0.7, 1.4, 2.1].forEach((offset, i) => {
      const st = ((t + offset) % 3.5) / 3.5;
      const sy = 50 - st * 220;
      const opacity = st < 0.15 ? st / 0.15 : st > 0.85 ? (1 - st) / 0.15 : 1;
      const wobble = Math.sin(st * Math.PI * 4 + i) * 14;
      const sx = 80 + i * 14 + wobble;
      const scale = 0.4 + st * 1.6;
      const steam = svg.querySelector(`#steam-${i}`) as SVGGElement;
      if (steam) {
        steam.setAttribute('transform', `translate(${sx} ${sy}) scale(${scale})`);
        steam.setAttribute('opacity', String(opacity * 0.6));
      }
    });

    // Leaves sway
    const sway = Math.sin(t * 1.4) * 2;
    const leaves = svg.querySelector('#leaves') as SVGGElement;
    if (leaves) leaves.setAttribute('transform', `translate(1500 760) rotate(${-12 + sway})`);

    // Dust motes
    for (let i = 0; i < 24; i++) {
      const mote = svg.querySelector(`#mote-${i}`) as SVGCircleElement;
      if (!mote) continue;
      const baseX = (i * 173) % 1920;
      const baseY = (i * 211) % 1080;
      const drift  = Math.sin(t * 0.3 + i) * 18;
      const driftY = Math.cos(t * 0.25 + i * 0.7) * 14;
      mote.setAttribute('cx', String(baseX + drift));
      mote.setAttribute('cy', String(baseY + driftY));
    }

    // Light beam flicker
    const beam = svg.querySelector('#light-beam') as SVGGElement;
    if (beam) beam.setAttribute('opacity', String((0.9 + Math.sin(t * 0.6) * 0.05) * 0.18));
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    >
      <defs>
        <filter id="blur8" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0.07 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
          <stop offset="60%" stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id="vig2" cx="50%" cy="50%" r="70%">
          <stop offset="55%" stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.45" />
        </radialGradient>
        <linearGradient id="beam-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={PAL.butter} stopOpacity="0.8" />
          <stop offset="100%" stopColor={PAL.butter} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Deep layer — desk wood */}
      <g id="layer-deep">
        <rect x="-100" y="-100" width="3000" height="2000" fill={PAL.desk2} />
        {[0,320,640,960,1280,1600].map(x => (
          <g key={x}>
            <rect x={x-100} y="-100" width="320" height="2000" fill={x%640===0 ? PAL.desk1 : PAL.desk3} opacity="0.4" />
            <line x1={x} y1="-100" x2={x} y2="2000" stroke={PAL.ink} strokeWidth="1.5" opacity="0.18" />
          </g>
        ))}
        {Array.from({length:60}).map((_,i)=>{
          const x=(i*137)%1920, y=(i*89)%1080, w=60+((i*31)%220);
          return <ellipse key={i} cx={x} cy={y} rx={w} ry="1.2" fill={PAL.ink} opacity={0.04+(i%5)*0.012} />;
        })}
        {[[280,220,22],[1450,380,18],[820,760,14],[1620,880,24]].map(([x,y,r],i) => (
          <g key={i} opacity="0.18">
            <ellipse cx={x} cy={y} rx={r} ry={r*0.7} fill={PAL.ink} />
            <ellipse cx={x} cy={y} rx={r*0.55} ry={r*0.4} fill={PAL.desk3} />
          </g>
        ))}
        <rect x="-100" y="-100" width="3000" height="2000" fill="url(#vignette)" />
      </g>

      {/* Mid layer — objects */}
      <g id="layer-mid">
        {/* Paper pile */}
        <g transform="translate(1280 400) rotate(8)">
          <rect x="2" y="6" width="320" height="220" fill={PAL.ink} opacity="0.2" filter="url(#blur8)" />
          <rect x="-6" y="3" width="320" height="220" fill="#efe6d0" transform="rotate(-3)" />
          <rect x="4" y="-2" width="320" height="220" fill={PAL.paperWhite} transform="rotate(2)" />
          <rect x="0" y="0" width="320" height="220" fill={PAL.paperCream} />
          {Array.from({length:8}).map((_,i)=>(
            <line key={i} x1="22" y1={36+i*22} x2={22+(i%2===0?240:180)} y2={36+i*22} stroke={PAL.ink} strokeWidth="0.8" opacity="0.18" />
          ))}
          <text x="22" y="28" fontFamily="serif" fontSize="20" fill="#8b5c75" opacity="0.8">scratch ·</text>
          <g transform="translate(280 -10)" stroke="#a8a8a0" strokeWidth="3" fill="none">
            <path d="M 0 0 Q 0 60 14 60 Q 28 60 28 24 Q 28 8 14 8 Q 4 8 4 24 Q 4 40 14 40 Q 22 40 22 28" />
          </g>
        </g>

        {/* Notebook */}
        <g transform="translate(680 280) rotate(-4)">
          <rect x="-10" y="14" width="640" height="500" rx="6" fill={PAL.ink} opacity="0.18" filter="url(#blur8)" />
          <rect x="0" y="0" width="620" height="490" rx="3" fill={PAL.paperCream} />
          <rect x="305" y="0" width="14" height="490" fill={PAL.ink} opacity="0.08" />
          <line x1="312" y1="0" x2="312" y2="490" stroke={PAL.ink} strokeWidth="1" opacity="0.2" />
          {Array.from({length:12}).map((_,i) => (
            <line key={i} x1="20" y1={70+i*32} x2="295" y2={70+i*32} stroke={PAL.ink} strokeWidth="0.6" opacity="0.18" />
          ))}
          <text x="20" y="44" fontFamily="serif" fontSize="26" fill={PAL.accent} fontStyle="italic" opacity="0.9">Wed · May 1</text>
          <line x1="20" y1="52" x2="155" y2="55" stroke={PAL.accent} strokeWidth="2" opacity="0.6" />
          {[
            {y:90,  text:'sketch hero variants'},
            {y:122, text:'pick the type pairing'},
            {y:154, text:'export pebble icons'},
            {y:186, text:'devlog · week 14'},
          ].map((row,i) => (
            <g key={i}>
              <rect x="22" y={row.y-14} width="16" height="16" rx="3" fill="none" stroke={PAL.ink} strokeWidth="1.2" opacity="0.55" />
              {i < 1 && <path d={`M ${26} ${row.y-6} L ${30} ${row.y-2} L ${37} ${row.y-11}`} stroke={PAL.accent} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9" />}
              <text x="46" y={row.y} fontFamily="serif" fontSize="22" fill={PAL.ink} opacity="0.85">{row.text}</text>
            </g>
          ))}
          <text x="330" y="44" fontFamily="serif" fontSize="20" fill={PAL.ink} fontStyle="italic" opacity="0.5">notes</text>
          <g transform="translate(360 130)" stroke={PAL.ink} strokeWidth="1.4" fill="none" opacity="0.6">
            <path d="M 0 10 Q 0 30 20 30 L 36 30 Q 56 30 56 10 L 56 0 L 0 0 Z" />
            <path d="M 56 6 Q 70 6 70 14 Q 70 22 56 22" />
          </g>
          <text x="360" y="280" fontFamily="serif" fontSize="18" fill={PAL.ink} opacity="0.45">cozy &gt; clever</text>
        </g>

        {/* Coffee mug */}
        <g transform="translate(220 540)">
          <ellipse cx="100" cy="240" rx="140" ry="20" fill={PAL.ink} opacity="0.22" filter="url(#blur8)" />
          <ellipse cx="100" cy="232" rx="135" ry="22" fill={PAL.paperWhite} />
          <ellipse cx="100" cy="228" rx="135" ry="22" fill="#ece2cc" />
          <path d="M 30 60 Q 30 220 100 220 Q 170 220 170 60 Z" fill={PAL.paperWhite} />
          <ellipse cx="100" cy="60" rx="70" ry="14" fill="#3a2a1d" />
          <ellipse cx="100" cy="58" rx="64" ry="11" fill="#6e4830" />
          <ellipse cx="115" cy="55" rx="20" ry="4" fill="#c8a37e" opacity="0.7" />
          <path d="M 168 90 Q 220 90 220 130 Q 220 170 168 170" fill="none" stroke={PAL.paperWhite} strokeWidth="18" />
          <path d="M 168 90 Q 220 90 220 130 Q 220 170 168 170" fill="none" stroke="#ece2cc" strokeWidth="10" />
          <path d="M 50 80 Q 45 150 60 200" stroke="white" strokeWidth="6" opacity="0.5" fill="none" />
          <g opacity="0.55">
            {[0,0.7,1.4,2.1].map((_,i) => (
              <g key={i} id={`steam-${i}`}>
                <path d="M 0 0 q -8 -10 0 -20 q 8 -10 0 -20 q -8 -10 0 -20"
                  stroke={PAL.steam} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9" />
              </g>
            ))}
          </g>
        </g>

        {/* Pen */}
        <g transform="translate(540 800) rotate(28)">
          <rect x="0" y="14" width="280" height="6" fill={PAL.ink} opacity="0.2" filter="url(#blur8)" />
          <rect x="0" y="0" width="220" height="14" rx="4" fill={PAL.accent} />
          <rect x="0" y="0" width="220" height="4" fill="#d57954" />
          <rect x="170" y="-2" width="14" height="18" fill={PAL.butter} />
          <path d="M 220 0 L 250 7 L 220 14 Z" fill="#3a2f24" />
          <path d="M 250 7 L 262 7" stroke="#3a2f24" strokeWidth="2" />
        </g>

        {/* Sticky notes */}
        <g transform="translate(1380 240) rotate(-6)">
          <rect x="3" y="6" width="160" height="160" fill={PAL.ink} opacity="0.2" filter="url(#blur8)" />
          <rect x="0" y="0" width="160" height="160" fill="#e6c46a" />
          <rect x="0" y="0" width="160" height="22" fill="black" opacity="0.06" />
          {[60,90,70].map((w,i) => <line key={i} x1="14" y1={48+i*22} x2={14+w} y2={48+i*22} stroke={PAL.ink} strokeWidth="2" opacity="0.55" strokeLinecap="round" />)}
        </g>
        <g transform="translate(120 220) rotate(4)">
          <rect x="3" y="6" width="160" height="160" fill={PAL.ink} opacity="0.2" filter="url(#blur8)" />
          <rect x="0" y="0" width="160" height="160" fill={PAL.sage} opacity="0.7" />
          <rect x="0" y="0" width="160" height="22" fill="black" opacity="0.06" />
          {[80,60].map((w,i) => <line key={i} x1="14" y1={48+i*22} x2={14+w} y2={48+i*22} stroke={PAL.ink} strokeWidth="2" opacity="0.55" strokeLinecap="round" />)}
        </g>

        {/* Leaves */}
        <g id="leaves" transform="translate(1500 760) rotate(-12)">
          <path d="M 0 0 Q 30 -80 60 -180 Q 70 -240 50 -300" stroke="#5b6f4f" strokeWidth="3" fill="none" />
          {[[10,-40,-45,0.9],[40,-100,35,1.0],[62,-160,-50,0.85],[50,-220,40,0.95],[40,-270,-30,0.75]].map(([lx,ly,rot,sc],i) => (
            <g key={i} transform={`translate(${lx} ${ly}) rotate(${rot}) scale(${sc})`}>
              <path d="M 0 0 Q 18 -10 30 -30 Q 18 -22 0 0 Z" fill={PAL.sage} />
              <path d="M 0 0 Q 18 -10 30 -30" stroke="#5b6f4f" strokeWidth="0.8" fill="none" opacity="0.6" />
            </g>
          ))}
        </g>
      </g>

      {/* Front layer — dust + light */}
      <g id="layer-front">
        <g id="light-beam" opacity="0.18">
          <polygon points="-100,-100 1000,-100 1300,1200 -100,1200" fill="url(#beam-grad)" />
        </g>
        <g opacity="0.5">
          {Array.from({length:24}).map((_,i) => {
            const r = 1+(i%3)*0.8;
            return <circle key={i} id={`mote-${i}`} cx={(i*173)%1920} cy={(i*211)%1080} r={r} fill={PAL.paperCream} opacity={0.3+(i%4)*0.12} />;
          })}
        </g>
      </g>

      {/* Film grain + final vignette */}
      <rect x="0" y="0" width="1920" height="1080" fill="white" filter="url(#grain)" opacity="0.5" pointerEvents="none" />
      <rect x="0" y="0" width="1920" height="1080" fill="url(#vig2)" pointerEvents="none" />
    </svg>
  );
}
