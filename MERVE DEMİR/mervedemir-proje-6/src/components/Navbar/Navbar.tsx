'use client';

import React, { useState, useEffect } from 'react';
import { siteConfig } from '@/data/site-config';
import '@/styles/navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { navbar } = siteConfig;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#hero" className="navbar-logo" onClick={(e) => handleLinkClick(e, '#hero')}>
          <span className="navbar-logo-name">{navbar.logo.name}</span>
          <span className="navbar-logo-subtitle">{navbar.logo.subtitle}</span>
        </a>

        <ul className="navbar-links">
          {navbar.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="navbar-link"
                onClick={(e) => handleLinkClick(e, link.href)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={navbar.cta.href}
          className="navbar-cta"
          onClick={(e) => handleLinkClick(e, navbar.cta.href)}
        >
          {navbar.cta.label}
        </a>

        <button
          className={`navbar-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menüyü aç"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`navbar-mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navbar.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="navbar-link"
            onClick={(e) => handleLinkClick(e, link.href)}
          >
            {link.label}
          </a>
        ))}
        <a
          href={navbar.cta.href}
          className="navbar-cta"
          onClick={(e) => handleLinkClick(e, navbar.cta.href)}
        >
          {navbar.cta.label}
        </a>
      </div>
    </>
  );
}
