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
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 18]);

  return (
    <section
      ref={sectionRef}
      style={{
        background: "linear-gradient(160deg, rgba(20,32,53,0.55) 0%, rgba(0,0,0,0) 55%)",
        borderBottom: "1px solid var(--border)",
        padding: "48px 0 56px",
      }}
    >
      <div className="container">
        <motion.div
          className="ph-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.5 }}
            >
              <svg width="7" height="7" viewBox="0 0 7 7" fill="none" aria-hidden>
                <circle cx="3.5" cy="3.5" r="3.5" fill="#22C55E" />
              </svg>
              Predator × Solary
            </motion.span>

            <motion.h1
              className="ph-headline"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              Competitive power,{" "}
              <span style={{ color: "#22C55E" }}>refined.</span>
            </motion.h1>

            <motion.p
              className="ph-body"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.52 }}
            >
              Intel Core i9 muscle, RTX 4070 graphics, and a silky 240&thinsp;Hz
              WQXGA panel — the Helios Neo 16 is built for players who demand
              both raw speed and a flawless visual experience.
            </motion.p>

            <motion.div
              className="ph-specs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46, duration: 0.5 }}
            >
              {SPECS.map((s) => (
                <span key={s} className="ph-chip">{s}</span>
              ))}
            </motion.div>

            <motion.div
              className="ph-price-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54, duration: 0.45 }}
            >
              <span className="ph-price">€2&thinsp;496</span>
              <span className="ph-price-meta">TTC&ensp;·&ensp;In Stock</span>
            </motion.div>

            <motion.div
              className="ph-ctas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.45 }}
            >
              <Link className="btn btn-lg ph-btn-primary" href={href}>
                Shop now
              </Link>
              <Link className="btn btn-ghost btn-lg" href={href} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                View specs →
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Right visual ── */}
          <div className="ph-right">
            <div className="ph-right-glow" />
            {/* Grid lines overlay */}
            <div className="ph-grid-lines" aria-hidden />
            <motion.div
              style={{ y: imgY }}
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="ph-visual-wrap"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              >
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
              </motion.div>

              {/* Floating micro-panel accent */}
              <motion.div
                className="ph-micro-panel"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <span className="ph-micro-dot" />
                <span className="ph-micro-label">240 Hz · WQXGA</span>
              </motion.div>

              <motion.div
                className="ph-micro-panel ph-micro-panel-br"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.05, duration: 0.5 }}
              >
                <span className="ph-micro-dot" style={{ background: "#3060C8" }} />
                <span className="ph-micro-label">RTX 4070 · 8 GB GDDR6</span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
