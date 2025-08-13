import { motion } from 'framer-motion';

// Staggered animation for elements appearing one after another
export const staggeredContainer = (staggerChildren = 0.05, delayChildren = 0) => {
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
};

// Fade in animation for any element
export const fadeIn = (direction = 'up', type = 'tween', delay = 0, duration = 0.5) => {
  return {
    hidden: {
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      opacity: 0,
    },
    show: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type,
        delay,
        duration,
        ease: 'easeOut',
      },
    },
  };
};

// Scale animation for cards and elements that grow
export const scaleIn = (delay = 0, duration = 0.5) => {
  return {
    hidden: { scale: 0.9, opacity: 0 },
    show: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        delay,
        duration,
        ease: 'easeOut',
      },
    },
  };
};

// Slide in animation for side elements
export const slideIn = (direction = 'left', type = 'tween', delay = 0, duration = 0.5) => {
  return {
    hidden: {
      x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
      y: direction === 'up' ? '100%' : direction === 'down' ? '100%' : 0,
      opacity: 0,
    },
    show: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        type,
        delay,
        duration,
        ease: 'easeOut',
      },
    },
  };
};

// Bounce animation for alerts and notifications
export const bounceIn = (delay = 0, duration = 0.5) => {
  return {
    hidden: { scale: 0, opacity: 0 },
    show: {
      scale: [0, 1.2, 1],
      opacity: 1,
      transition: {
        type: 'spring',
        delay,
        duration,
        bounce: 0.5,
      },
    },
  };
};

// Text animation for headings with character staggering
export const textVariant = (delay = 0) => {
  return {
    hidden: {
      y: 20,
      opacity: 0,
    },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        delay,
        duration: 0.7,
      },
    },
  };
};

// Animation for text characters appearing one by one
export const textContainer = {
  hidden: {
    opacity: 0,
  },
  show: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: i * 0.1 },
  }),
};

export const textChild = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween',
      ease: 'easeIn',
    },
  },
};

// Path drawing animation for SVGs
export const svgPathDraw = (delay = 0, duration = 1.5) => {
  return {
    hidden: { pathLength: 0, opacity: 0 },
    show: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          delay,
          type: "spring",
          duration,
          bounce: 0
        },
        opacity: { delay, duration: 0.01 }
      }
    }
  };
};

// Animation for number counters
export const counterAnimation = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
};

// Container component with motion
export const MotionContainer = motion.div;
