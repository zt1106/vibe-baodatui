import type { Variants } from 'framer-motion';

export const flipVariants: Variants = {
  face: {
    rotateY: 0,
    transition: { duration: 0.24, ease: 'easeInOut' }
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.24, ease: 'easeInOut' }
  }
};

export const dealVariants: Variants = {
  hidden: ({ originX = 0, originY = 0 } = {}) => ({
    opacity: 0,
    x: originX,
    y: originY,
    scale: 0.6
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 26 }
  }
};

export const discardVariants: Variants = {
  idle: { opacity: 1, rotateZ: 0 },
  discard: {
    opacity: 0,
    rotateZ: 25,
    x: 60,
    y: 120,
    transition: { duration: 0.35, ease: 'easeIn' }
  }
};

export const shakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -6, 6, -4, 4, 0],
    transition: { duration: 0.4 }
  }
};
