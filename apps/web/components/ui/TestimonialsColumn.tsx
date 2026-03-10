"use client";

import React from "react";
import { motion } from "framer-motion";

export interface Testimonial {
  text: string;
  name: string;
  role?: string;
  date?: string;
}

export function TestimonialsColumn({
  testimonials,
  duration = 15,
  className,
}: {
  testimonials: Testimonial[];
  duration?: number;
  className?: string;
}) {
  return (
    <div className={`testimonials-col ${className ?? ""}`}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        className="testimonials-col-inner"
      >
        {[0, 1].map((pass) => (
          <React.Fragment key={pass}>
            {testimonials.map((t, i) => (
              <div className="testimonial-card" key={`${pass}-${i}`}>
                {/* Stars */}
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-footer">
                  <div className="testimonial-avatar">
                    {t.name === "Anonymous" ? "?" : t.name[0].toUpperCase()}
                  </div>
                  <div className="testimonial-meta">
                    <span className="testimonial-name">{t.name}</span>
                    {t.role && <span className="testimonial-role">{t.role}</span>}
                    {t.date && <span className="testimonial-date">{t.date}</span>}
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
