"use client";

import { useEffect } from "react";

export function DashboardEffects() {
  useEffect(() => {
    // Intersection Observer for Scroll Animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { 
            if (entry.isIntersecting) entry.target.classList.add('visible'); 
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => scrollObserver.observe(el));

    // 3D Tilt Effect
    const tiltCards = document.querySelectorAll('.tilt-card') as NodeListOf<HTMLElement>;
    const handleMouseMove = (e: MouseEvent, card: HTMLElement) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02) translateZ(30px)`;
        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;
        card.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 107, 61, 0.12) 0%, rgba(255, 255, 255, 0.02) 80%)`;
    };

    const handleMouseLeave = (card: HTMLElement) => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1) translateZ(0)`;
        card.style.background = `rgba(255, 255, 255, 0.02)`;
    };

    const mouseMoveListeners = new Map();
    const mouseLeaveListeners = new Map();

    tiltCards.forEach(card => {
        const moveFn = (e: MouseEvent) => handleMouseMove(e, card);
        const leaveFn = () => handleMouseLeave(card);
        mouseMoveListeners.set(card, moveFn);
        mouseLeaveListeners.set(card, leaveFn);
        card.addEventListener('mousemove', moveFn as EventListener);
        card.addEventListener('mouseleave', leaveFn as EventListener);
    });

    // Hero Progress
    const ring = document.getElementById('hero-progress-ring') as unknown as SVGCircleElement;
    if (ring) {
        const radius = ring.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        ring.style.strokeDasharray = `${circumference} ${circumference}`;
        ring.style.strokeDashoffset = String(circumference - (75 / 100) * circumference);
    }

    return () => {
        revealElements.forEach(el => scrollObserver.unobserve(el));
        tiltCards.forEach(card => {
            card.removeEventListener('mousemove', mouseMoveListeners.get(card));
            card.removeEventListener('mouseleave', mouseLeaveListeners.get(card));
        });
    };
  }, []);

  return null;
}
