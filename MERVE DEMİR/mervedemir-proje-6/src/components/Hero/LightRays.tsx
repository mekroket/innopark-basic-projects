import React from 'react';
import '@/styles/animations.css';

export default function LightRays() {
  return (
    <div className="light-rays-container" aria-hidden="true">
      <div className="light-ray light-ray-1" />
      <div className="light-ray light-ray-2" />
      <div className="light-ray light-ray-3" />
      <div className="light-ray light-ray-4" />
      <div className="light-ray light-ray-5" />
    </div>
  );
}
