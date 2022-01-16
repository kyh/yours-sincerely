import { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";

function Card(props: any) {
  const x = useMotionValue(0);
  const scale = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
  const rotate = useTransform(x, [-150, 0, 150], [-45, 0, 45], {
    clamp: false,
  });

  function handleDragEnd(event: any, info: any) {
    if (info.offset.x < -100) {
      props.setExitX(-250);
      props.setIndex(props.index + 1);
    }
    if (info.offset.x > 100) {
      props.setExitX(250);
      props.setIndex(props.index + 1);
    }
  }

  return (
    <motion.div
      style={{
        width: 150,
        height: 150,
        position: "absolute",
        top: 0,
        x: x,
        rotate: rotate,
        cursor: "grab",
      }}
      whileTap={{ cursor: "grabbing" }}
      drag={props.drag}
      dragConstraints={{
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
      onDragEnd={handleDragEnd}
      initial={props.initial}
      animate={props.animate}
      transition={props.transition}
      exit={{
        x: props.exitX,
        opacity: 0,
        scale: 0.5,
        transition: { duration: 0.2 },
      }}
    >
      <motion.div
        style={{
          width: 150,
          height: 150,
          backgroundColor: "#fff",
          borderRadius: 30,
          scale: scale,
        }}
      />
    </motion.div>
  );
}

export function Example() {
  const [index, setIndex] = useState(0);
  const [exitX, setExitX] = useState("100%");

  return (
    <motion.div
      style={{
        width: 150,
        height: 150,
        position: "relative",
      }}
    >
      <AnimatePresence initial={false}>
        <Card
          key={index + 1}
          initial={{ scale: 0, y: 105, opacity: 0 }}
          animate={{ scale: 0.75, y: 30, opacity: 0.5 }}
          transition={{
            scale: { duration: 0.2 },
            opacity: { duration: 0.4 },
          }}
        />
        <Card
          key={index}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            opacity: { duration: 0.2 },
          }}
          exitX={exitX}
          setExitX={setExitX}
          index={index}
          setIndex={setIndex}
          drag="x"
        />
      </AnimatePresence>
    </motion.div>
  );
}
