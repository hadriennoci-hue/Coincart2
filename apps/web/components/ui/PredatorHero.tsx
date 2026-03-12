"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { fmtPrice } from "../../lib/format";

interface PredatorHeroProps {
  name: string;
  category?: string | null;
  description?: string | null;
  specs: string[];
  price: number;
  promoPrice?: number | null;
  currency: "EUR" | "USD";
  stockQty: number;
  href?: string;
}

export function PredatorHero({
  name,
  category,
  description,
  specs,
  price,
  promoPrice,
  currency,
  stockQty,
  href = "/search?category=Laptops",
}: PredatorHeroProps) {
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
            <div className="ph-ambient" />
            <span className="ph-corner ph-corner-tl" />
            <span className="ph-corner ph-corner-tr" />
            <span className="ph-corner ph-corner-bl" />
            <span className="ph-corner ph-corner-br" />

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
                {category || "Featured Product"}
              </motion.span>

              <motion.h1
                className="ph-headline"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {name}
              </motion.h1>

              {specs.length > 0 ? (
                <motion.div
                  className="ph-specs"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32, duration: 0.4 }}
                >
                  {specs.map((spec) => (
                    <span key={spec} className="ph-chip">
                      {spec}
                    </span>
                  ))}
                </motion.div>
              ) : (
                <motion.p
                  className="ph-body"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32, duration: 0.4 }}
                >
                  {description || "Discover this product and pay securely with crypto."}
                </motion.p>
              )}

              <motion.div
                className="ph-price-row"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                {promoPrice && promoPrice < price ? (
                  <>
                    <span className="ph-price ph-price-old">{fmtPrice(price, currency)}</span>
                    <span className="ph-price">{fmtPrice(promoPrice, currency)}</span>
                  </>
                ) : (
                  <span className="ph-price">{fmtPrice(price, currency)}</span>
                )}
                <span className={stockQty > 0 ? "badge badge-green" : "badge badge-error"}>
                  {stockQty > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </motion.div>
            </motion.div>

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
                <video
                  src="/Output.webm"
                  className="ph-img"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </motion.div>
            </div>
          </motion.div>
        </Link>
      </div>
    </section>
  );
}
