import { AnimatePresence, motion, useInView } from 'framer-motion';
import * as React from 'react';
 
const GradualSpacing : React.FC<{text: string, className: string, containerClassName: string, onCompletion?: ()=>void }> = ({ text , className, containerClassName, onCompletion}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
      <motion.div 
      className={containerClassName}
      onAnimationComplete={onCompletion}
      >
        {text.split('').map((char, i) => (
          <motion.span
            ref={ref}
            key={i}
            initial={{ opacity: 0, x: -18 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            exit="hidden"
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`w-0 ${className}`}
          >
            {char === ' ' ? <span>&nbsp;</span> : char}
          </motion.span>
        ))}
      </motion.div>
  )
}
 

export default GradualSpacing;