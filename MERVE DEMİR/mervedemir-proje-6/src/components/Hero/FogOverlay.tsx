import React from 'react';
import '@/styles/animations.css';

export default function FogOverlay() {
  return (
    <div className="fog-container" aria-hidden="true">
      <div className="fog-layer fog-layer-1" />
      <div className="fog-layer fog-layer-2" />
      <div className="fog-layer fog-layer-3" />
      <div className="fog-layer fog-layer-4" />
      <div className="fog-layer fog-layer-5" />
    </div>
  );
}
