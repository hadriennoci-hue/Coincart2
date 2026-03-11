"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

const SPECS = [
  "Intel Core i9-14900HX",
  "RTX 4070",
  "32 GB DDR5",
  "1 TB SSD",
  '16" WQXGA IPS',
  "240 Hz",
];

interface PredatorHeroProps {
  imageUrl?: string | null;
  href?: string;
}

export function PredatorHero({ imageUrl, href = "/search?category=Laptops" }: PredatorHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 24]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 12]);

  return (
    <section
      ref={sectionRef}
      style={{
        background: "linear-gradient(160deg, rgba(20,32,53,0.55) 0%, rgba(0,0,0,0) 55%)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 0 14px",
      }}
    >
      <div className="container">
        <Link href={href} style={{ display: "block", textDecoration: "none" }}>
          <motion.div
            className="ph-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Ambient inner glow */}
            <div className="ph-ambient" />

            {/* Corner accents */}
            <span className="ph-corner ph-corner-tl" />
            <span className="ph-corner ph-corner-tr" />
            <span className="ph-corner ph-corner-bl" />
            <span className="ph-corner ph-corner-br" />

            {/* ── Left content ── */}
            <motion.div className="ph-left" style={{ y: textY }}>
              <motion.span
                className="ph-eyebrow"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                <svg width="7" height="7" viewBox="0 0 7 7" fill="none" aria-hidden>
                  <circle cx="3.5" cy="3.5" r="3.5" fill="#22C55E" />
                </svg>
                Predator × Solary
              </motion.span>

              <motion.h1
                className="ph-headline"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                Competitive power,{" "}
                <span style={{ color: "#22C55E" }}>refined.</span>
              </motion.h1>

              <motion.div
                className="ph-specs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.4 }}
              >
                {SPECS.map((s) => (
                  <span key={s} className="ph-chip">{s}</span>
                ))}
              </motion.div>

              <motion.div
                className="ph-price-row"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <span className="ph-price">€2&thinsp;496</span>
                <span className="ph-price-meta">TTC&ensp;·&ensp;In Stock</span>
              </motion.div>
            </motion.div>

            {/* ── Right visual ── */}
            <div className="ph-right">
              <div className="ph-right-glow" />
              <div className="ph-grid-lines" aria-hidden />
              <motion.div
                style={{ y: imgY }}
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="ph-visual-wrap"
              >
                <div className="ph-flip-card">
                  <div className="ph-flip-inner">
                    {/* Front: product image */}
                    <div className="ph-flip-front">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Acer Predator Helios Neo 16"
                          className="ph-img"
                          width={960}
                          height={600}
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                        />
                      ) : (
                        <div className="ph-img-placeholder">
                          <span>Acer Predator Helios Neo 16</span>
                        </div>
                      )}
                      <div className="ph-micro-panel">
                        <span className="ph-micro-dot" />
                        <span className="ph-micro-label">240 Hz · WQXGA</span>
                      </div>
                      <div className="ph-micro-panel ph-micro-panel-br">
                        <span className="ph-micro-dot" style={{ background: "#3060C8" }} />
                        <span className="ph-micro-label">RTX 4070 · 8 GB GDDR6</span>
                      </div>
                    </div>
                    {/* Back: specs */}
                    <div className="ph-flip-back">
                      <div className="ph-flip-back-chips">
                        {SPECS.map((s) => (
                          <span key={s} className="ph-flip-back-chip">{s}</span>
                        ))}
                      </div>
                      <span className="ph-flip-back-cta">View Product →</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </Link>
      </div>
    </section>
  );
}
