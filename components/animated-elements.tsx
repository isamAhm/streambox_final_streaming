import { motion } from "framer-motion";

// Fade in animation for sections
export const FadeIn = ({ 
  children, 
  delay = 0, 
  className = "",
  direction = "up",
  ...props 
}: { 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  [key: string]: any;
}) => {
  const directionValues = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 }
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0,
        ...directionValues[direction]
      }}
      animate={{ 
        opacity: 1,
        x: 0,
        y: 0
      }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut"
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Staggered children animation
export const StaggeredContainer = ({
  children,
  staggerChildren = 0.1,
  delayChildren = 0,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  staggerChildren?: number;
  delayChildren?: number;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren,
            delayChildren
          }
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Item variants for use within StaggeredContainer
export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Scale animation for card hovers
export const ScaleOnHover = ({
  children,
  scale = 1.05,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  scale?: number;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <motion.div
      whileHover={{ scale }}
      transition={{ duration: 0.3 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Animated count (for statistics, etc.)
export const AnimatedCounter = ({
  from = 0,
  to,
  duration = 1.5,
  className = "",
  ...props
}: {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  [key: string]: any;
}) => {
  // Using simpler approach for count animation
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {to}
    </motion.span>
  );
};