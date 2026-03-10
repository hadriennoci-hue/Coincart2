"use client";

import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import React from "react";

type PresetType =
  | "fade"
  | "slide"
  | "scale"
  | "blur"
  | "blur-slide"
  | "zoom"
  | "flip"
  | "bounce"
  | "rotate"
  | "swing";

type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variants?: { container?: Variants; item?: Variants };
  preset?: PresetType;
  itemStyle?: React.CSSProperties;
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const presetVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  fade: {
    container: defaultContainerVariants,
    item: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } },
  },
  slide: {
    container: defaultContainerVariants,
    item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
  },
  scale: {
    container: defaultContainerVariants,
    item: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } } },
  },
  blur: {
    container: defaultContainerVariants,
    item: { hidden: { opacity: 0, filter: "blur(6px)" }, visible: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.4 } } },
  },
  "blur-slide": {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: "blur(4px)", y: 16 },
      visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
    },
  },
  zoom: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    },
  },
  flip: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, rotateX: -90 },
      visible: { opacity: 1, rotateX: 0, transition: { type: "spring", stiffness: 300, damping: 20 } },
    },
  },
  bounce: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: -40 },
      visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 10 } },
    },
  },
  rotate: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, rotate: -180 },
      visible: { opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 15 } },
    },
  },
  swing: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, rotate: -8 },
      visible: { opacity: 1, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 8 } },
    },
  },
};

function AnimatedGroup({
  children,
  className,
  style,
  variants,
  preset = "blur-slide",
  itemStyle,
}: AnimatedGroupProps) {
  const selected = presetVariants[preset];
  const containerVariants = variants?.container ?? selected.container;
  const itemVariants = variants?.item ?? selected.item;

  return (
    <motion.div
      className={className}
      style={style}
      initial={false}
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={containerVariants}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants} style={itemStyle}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export { AnimatedGroup };
export type { AnimatedGroupProps, PresetType };
