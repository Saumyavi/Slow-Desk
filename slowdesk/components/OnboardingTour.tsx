'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';

const STEPS = [
  {
    icon: '🏠',
    title: 'Welcome to SlowDesk',
    body: 'A calm, focused workspace designed to help you do your best work without the noise. Let\'s take a quick look around.',
  },
  {
    icon: '✅',
    title: 'Tasks',
    body: 'Add and manage your to-dos in the Tasks section. Set priorities (high, medium, low) and due dates. Check off tasks to track your progress.',
  },
  {
    icon: '📸',
    title: 'Photo to Tasks',
    body: 'Snap a photo of printed task lists or typed notes and OCR will extract tasks automatically. Works best with clear, printed text. Click "Scan" on the Tasks page to try it — completely free!',
  },
  {
    icon: '📁',
    title: 'Projects',
    body: 'Group related work into Projects. Track progress, deadlines, and team members — all in one place.',
  },
  {
    icon: '📅',
    title: 'Calendar',
    body: 'See your schedule at a glance. Add events with times and colors to keep your day organized.',
  },
  {
    icon: '🌱',
    title: 'Habits',
    body: 'Build streaks by logging daily habits. The heatmap on your dashboard shows your consistency over time.',
  },
  {
    icon: '📝',
    title: 'Notes',
    body: 'Capture ideas, meeting notes, and thoughts. Notes are private and saved automatically.',
  },
  {
    icon: '☕',
    title: 'Morning Ritual',
    body: 'Get a calm summary of today\'s tasks delivered to your email or WhatsApp each morning — exactly when your day starts. Set it up in Profile → Morning Ritual.',
  },
  {
    icon: '🎨',
    title: 'Make it yours',
    body: 'Open the Tweaks panel (bottom-left ⊞ icon) to change your theme, accent color, layout density, and more.',
  },
];

export default function OnboardingTour() {
  const { completeTour } = useApp();
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(30,20,10,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)',
    }}>
      <div style={{
        background: 'var(--bg-elev)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: '36px 40px 28px',
        width: 420,
        maxWidth: '90vw',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>
        {/* Step icon */}
        <div style={{ fontSize: 44, textAlign: 'center', marginBottom: 12 }}>
          {current.icon}
        </div>

        {/* Title */}
        <h2 style={{
          margin: '0 0 10px',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--ink)',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
        }}>
          {current.title}
        </h2>

        {/* Body */}
        <p style={{
          margin: '0 0 28px',
          fontSize: 14,
          lineHeight: 1.65,
          color: 'var(--ink-muted)',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
        }}>
          {current.body}
        </p>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 18 : 7,
                height: 7,
                borderRadius: 4,
                background: i === step ? 'var(--accent)' : 'var(--line)',
                cursor: 'pointer',
                transition: 'width 0.2s, background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={completeTour}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink-faint)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Skip tour
          </button>

          {isLast ? (
            <button
              onClick={completeTour}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Get started
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              style={{
                padding: '8px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
