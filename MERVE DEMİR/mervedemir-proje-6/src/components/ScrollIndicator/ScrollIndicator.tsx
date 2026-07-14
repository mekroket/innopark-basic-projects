'use client';

import React from 'react';
import { siteConfig } from '@/data/site-config';
import '@/styles/scroll-indicator.css';

export default function ScrollIndicator() {
  return (
    <div className="scroll-indicator" aria-hidden="true">
      <span className="scroll-indicator-text">
        {siteConfig.scrollIndicator.text}
      </span>
      <div className="scroll-indicator-line" />
      <div className="scroll-indicator-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
