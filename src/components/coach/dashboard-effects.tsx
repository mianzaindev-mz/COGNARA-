"use client";

import { useEffect } from "react";

export function DashboardEffects() {
  useEffect(() => {
    // Entrance stagger
    const staggerElements = document.querySelectorAll('.entrance-stagger > *');
    staggerElements.forEach((el, index) => {
        (el as HTMLElement).style.animationDelay = `${index * 0.1}s`;
    });

    // Refined 3D Hover Parallax for cards
    const tiltCards = document.querySelectorAll('.glass-card') as NodeListOf<HTMLElement>;
    
    const handleMouseMove = (e: MouseEvent, card: HTMLElement) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 80;
        const rotateY = (centerX - x) / 80;
        
        card.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    };

    const handleMouseLeave = (card: HTMLElement) => {
        card.style.transform = `perspective(1500px) rotateX(0deg) rotateY(0deg) translateY(0)`;
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

    return () => {
        tiltCards.forEach(card => {
            card.removeEventListener('mousemove', mouseMoveListeners.get(card));
            card.removeEventListener('mouseleave', mouseLeaveListeners.get(card));
        });
    };
  }, []);

  return null;
}
