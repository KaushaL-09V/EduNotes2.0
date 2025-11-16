import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Dock = ({ items, panelHeight = 68, baseItemSize = 50, magnification = 70 }) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        style={{ height: panelHeight }}
        className="flex items-end gap-3 px-4 pb-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-2xl"
      >
        {items.map((item, index) => (
          <DockItem
            key={item.id || index}
            mouseX={mouseX}
            item={item}
            baseSize={baseItemSize}
            magnification={magnification}
          />
        ))}
      </motion.div>
    </div>
  );
};

const DockItem = ({ mouseX, item, baseSize, magnification }) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [baseSize, magnification, baseSize]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      ref={ref}
      style={{ width, height: width }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex items-center justify-center cursor-pointer"
    >
      <button
        onClick={item.onClick}
        className="w-full h-full flex items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white hover:shadow-lg transition-shadow cursor-target"
        aria-label={item.label}
      >
        {item.icon}
      </button>
      {isHovered && item.label && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap">
          {item.label}
        </div>
      )}
    </motion.div>
  );
};

export default Dock;
