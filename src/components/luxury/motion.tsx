'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

type MotionRevealProps = HTMLMotionProps<'motion.div'> & {
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

/** Scroll-reveal with fade-up — use on sections and cards */
export function MotionReveal({ delay = 0, className, children, ...props }: MotionRevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUp}
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type MotionStaggerProps = {
  className?: string;
  children: React.ReactNode;
};

/** Stagger children on scroll */
export function MotionStagger({ className, children }: MotionStaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type MotionItemProps = {
  className?: string;
  children: React.ReactNode;
};

export function MotionItem({ className, children }: MotionItemProps) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

type MotionHeroProps = {
  className?: string;
  children: React.ReactNode;
};

/** Hero content — animate on mount */
export function MotionHero({ className, children }: MotionHeroProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function MotionHeroItem({ className, children }: MotionItemProps) {
  return (
    <motion.div variants={fadeUp} custom={0} className={className}>
      {children}
    </motion.div>
  );
}

/** Floating ambient orb for backgrounds */
export function MotionOrb({ className }: { className?: string }) {
  return (
    <motion.div
      aria-hidden
      className={cn('luxury-orb pointer-events-none absolute rounded-full blur-3xl', className)}
      animate={{
        scale: [1, 1.08, 1],
        opacity: [0.4, 0.55, 0.4],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
