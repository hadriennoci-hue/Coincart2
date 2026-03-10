"use client";

import React from "react";

export interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
  href?: string;
  onClick?: () => void;
}

interface BentoGridProps {
  items: BentoItem[];
  columns?: 2 | 3;
}

function BentoGrid({ items, columns = 3 }: BentoGridProps) {
  return (
    <div className="bento-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((item, index) => {
        const cardClass = `bento-card${item.hasPersistentHover ? " bento-card-active" : ""}${item.href || item.onClick ? " bento-card-clickable" : ""}`;
        const style = item.colSpan === 2 ? { gridColumn: "span 2" } : undefined;

        const inner = (
          <>
            <div className={`bento-dots${item.hasPersistentHover ? " bento-dots-visible" : ""}`} />
            <div className="bento-card-inner">
              <div className="bento-card-header">
                <div className="bento-icon-wrap">{item.icon}</div>
                <span className="bento-status-badge">{item.status || "Active"}</span>
              </div>
              <div className="bento-card-content">
                <h3 className="bento-card-title">
                  {item.title}
                  {item.meta && <span className="bento-meta">{item.meta}</span>}
                </h3>
                <p className="bento-card-desc">{item.description}</p>
              </div>
              <div className="bento-card-footer">
                <div className="bento-tags">
                  {item.tags?.map((tag, i) => (
                    <span key={i} className="bento-tag">#{tag}</span>
                  ))}
                </div>
                <span className="bento-cta">{item.cta || "Explore →"}</span>
              </div>
            </div>
            <div className={`bento-border-glow${item.hasPersistentHover ? " bento-border-glow-visible" : ""}`} />
          </>
        );

        if (item.href) {
          return (
            <a key={index} href={item.href} className={cardClass} style={style}>
              {inner}
            </a>
          );
        }

        return (
          <div key={index} className={cardClass} style={style} onClick={item.onClick}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

export { BentoGrid };
