"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { siteConfig } from "@/data/site-config";
import Fireflies from "./Fireflies";
import FogOverlay from "./FogOverlay";
import LightRays from "./LightRays";
import "@/styles/hero.css";

export default function Hero() {
  const videoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  const { hero } = siteConfig;

  const applyMotion = useCallback(() => {
    const mx = mouse.current.x;
    const my = mouse.current.y;
    const sy = scroll.current;

    if (videoRef.current) {
      videoRef.current.style.transform = `scale(1.12) translate(${mx * -10}px, ${
        my * -8 + sy * 0.12
      }px)`;
    }

    if (contentRef.current) {
      contentRef.current.style.transform = `translate(${mx * 5}px, ${my * 4}px)`;
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.style.transform = `translate(${mx * -7}px, ${
        my * -5 + sy * 0.08
      }px)`;
    }
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      applyMotion();
    };

    const onScroll = () => {
      scroll.current = window.scrollY;
      applyMotion();
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [applyMotion]);

  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();

    const target = document.querySelector(href);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section className="hero" id="hero">
      <div className="hero-video-frame" ref={videoRef}>
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={hero.video.poster}
        >
          <source src={hero.video.src} type="video/mp4" />
        </video>
      </div>

      <div className="hero-overlay" />
      <div className="hero-gold-glow" />
      <div className="hero-vignette" />
      <div className="hero-watermark-cover" />

      <div className="hero-atmosphere" ref={atmosphereRef}>
        <FogOverlay />
        <LightRays />
        <Fireflies />
      </div>

      <div className="hero-layout">
        <div className="hero-content" ref={contentRef}>
          <p className="hero-welcome">{hero.greeting}</p>

          <h1 className="hero-title">
            <span>{hero.prefix}</span>
            <strong>{hero.name}</strong>
          </h1>

          <p className="hero-role">{hero.subtitle}</p>

          <p className="hero-description">{hero.description}</p>

          <div className="hero-actions">
            <a
              href={hero.buttons.primary.href}
              className="hero-primary"
              onClick={(e) => goTo(e, hero.buttons.primary.href)}
            >
              {hero.buttons.primary.label}
              <span>✦</span>
            </a>

            <a
              href={hero.buttons.secondary.href}
              className="hero-secondary"
              onClick={(e) => goTo(e, hero.buttons.secondary.href)}
            >
              {hero.buttons.secondary.label}
              <span>→</span>
            </a>
          </div>
        </div>
      </div>

      <div className="hero-scroll">
        <span>{siteConfig.scrollIndicator.text}</span>
        <i />
      </div>
    </section>
  );
}