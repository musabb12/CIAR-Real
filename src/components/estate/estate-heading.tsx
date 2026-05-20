import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeUp, viewportOnce } from '@/lib/motion';

type EstateHeadingProps = {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: 'start' | 'center';
  className?: string;
};

export function EstateHeading({
  kicker,
  title,
  subtitle,
  align = 'start',
  className,
}: EstateHeadingProps) {
  const centered = align === 'center';

  return (
    <motion.header
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeUp}
      className={cn('estate-heading', centered && 'estate-heading--center', className)}
    >
      {kicker ? <p className="estate-heading-kicker">{kicker}</p> : null}
      <h2 className="estate-heading-title">{title}</h2>
      {subtitle ? (
        <p className={cn('text-muted-foreground text-base max-w-2xl', centered && 'mx-auto')}>
          {subtitle}
        </p>
      ) : null}
    </motion.header>
  );
}
