"use client";

import { useEffect } from "react";

// .reveal 要素をスクロールで表示する（元 script.js の移植）
export default function RevealInit() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((i) => i.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -35px" }
    );
    items.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 3, 2) * 80}ms`;
      observer.observe(item);
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
