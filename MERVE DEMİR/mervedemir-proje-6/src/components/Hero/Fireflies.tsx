'use client';

import React, { useMemo } from 'react';
import '@/styles/animations.css';

const FIREFLY_COUNT = 45;
const ORB_COUNT = 12;
const DUST_COUNT = 20;

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  animationName: string;
  animationDuration: string;
  animationDelay: string;
  type: 'firefly' | 'orb' | 'dust';
}

export default function Fireflies() {
  const particles = useMemo<Particle[]>(() => {
    const fireflyAnims = [
      'fireflyFloat1', 'fireflyFloat2', 'fireflyFloat3',
      'fireflyFloat4', 'fireflyFloat5', 'fireflyFloat6',
    ];
    const orbAnims = ['orbDrift1', 'orbDrift2'];
    const result: Particle[] = [];

    // Small fireflies
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      result.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 4,
        animationName: fireflyAnims[Math.floor(Math.random() * fireflyAnims.length)],
        animationDuration: `${8 + Math.random() * 14}s`,
        animationDelay: `${Math.random() * 12}s`,
        type: 'firefly',
      });
    }

    // Larger glowing orbs
    for (let i = 0; i < ORB_COUNT; i++) {
      result.push({
        id: FIREFLY_COUNT + i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 6 + Math.random() * 10,
        animationName: orbAnims[Math.floor(Math.random() * orbAnims.length)],
        animationDuration: `${15 + Math.random() * 20}s`,
        animationDelay: `${Math.random() * 15}s`,
        type: 'orb',
      });
    }

    // Dust motes
    for (let i = 0; i < DUST_COUNT; i++) {
      result.push({
        id: FIREFLY_COUNT + ORB_COUNT + i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: 1 + Math.random() * 2,
        animationName: 'dustDrift',
        animationDuration: `${20 + Math.random() * 25}s`,
        animationDelay: `${Math.random() * 20}s`,
        type: 'dust',
      });
    }

    return result;
  }, []);

  return (
    <div className="fireflies-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={
            p.type === 'orb'
              ? 'firefly-orb'
              : p.type === 'dust'
                ? 'dust-mote'
                : 'firefly'
          }
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationName: p.animationName,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </div>
  );
}
