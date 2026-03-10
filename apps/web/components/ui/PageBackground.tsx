"use client";

import { motion } from "framer-motion";

interface ShapeProps {
  delay?: number;
  width: number;
  height: number;
  rotate: number;
  color: string; // rgba color for the gradient start
  style?: React.CSSProperties;
}

function ElegantShape({ delay = 0, width, height, rotate, color, style }: ShapeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      style={{ position: "absolute", ...style }}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ width, height, position: "relative" }}
      >
        <div
          className="elegant-shape-inner"
          style={{
            background: `linear-gradient(to right, ${color}, transparent)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export function PageBackground() {
  return (
    <div className="page-bg-layer" aria-hidden="true">
      {/* Ambient glow */}
      <div className="page-bg-glow" />

      <ElegantShape
        delay={0.3}
        width={600}
        height={140}
        rotate={12}
        color="rgba(99,102,241,0.15)"
        style={{ left: "-5%", top: "20%" }}
      />
      <ElegantShape
        delay={0.5}
        width={500}
        height={120}
        rotate={-15}
        color="rgba(244,63,94,0.15)"
        style={{ right: "0%", top: "75%" }}
      />
      <ElegantShape
        delay={0.4}
        width={300}
        height={80}
        rotate={-8}
        color="rgba(139,92,246,0.15)"
        style={{ left: "10%", bottom: "10%" }}
      />
      <ElegantShape
        delay={0.6}
        width={200}
        height={60}
        rotate={20}
        color="rgba(245,158,11,0.15)"
        style={{ right: "20%", top: "15%" }}
      />
      <ElegantShape
        delay={0.7}
        width={150}
        height={40}
        rotate={-25}
        color="rgba(6,182,212,0.15)"
        style={{ left: "25%", top: "10%" }}
      />
    </div>
  );
}
