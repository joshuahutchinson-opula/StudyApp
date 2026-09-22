import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { useSpring } from "../hooks/useSpring";

// A plain <button> with a real spring-physics press, instead of no feedback
// at all or a CSS `transition-*` ease. Used for every clickable control that
// doesn't need its own bespoke animation (those wire into useSpring directly).
export const SpringButton = forwardRef<HTMLButtonElement, HTMLMotionProps<"button">>(
  ({ whileTap, transition, ...props }, ref) => {
    const spring = useSpring();
    return (
      <motion.button
        ref={ref}
        whileTap={whileTap ?? { scale: 0.94 }}
        transition={transition ?? spring.fast}
        {...props}
      />
    );
  },
);
SpringButton.displayName = "SpringButton";
