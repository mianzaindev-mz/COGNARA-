"use client";

import { useEffect } from "react";

export function AdminInteractiveEffects() {
  useEffect(() => {
    const cards = document.querySelectorAll(".glass-card");
    const cleanups: (() => void)[] = [];

    cards.forEach((card: any) => {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rotateX = (rect.height / 2 - y) / 25;
        const rotateY = (x - rect.width / 2) / 25;

        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;

        card.style.transform = `translateY(-8px) translateZ(40px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        const isLight = document.querySelector(".admin-theme")?.classList.contains("light");
        const baseBg = isLight ? "rgba(255, 255, 255, 0.75)" : "rgba(20, 20, 22, 0.4)";
        const glowOpacity = isLight ? "0.04" : "0.08";
        card.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(220, 20, 60, ${glowOpacity}) 0%, ${baseBg} 70%)`;
      };

      const handleMouseLeave = () => {
        card.style.transform = "translateY(0) translateZ(0) rotateX(0) rotateY(0)";
        card.style.background = "";
      };

      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);

      cleanups.push(() => {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseleave", handleMouseLeave);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}
