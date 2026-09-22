import { motion } from "motion/react";
import type { TabDivider } from "@the-desk/shared";
import { useSpring } from "../../hooks/useSpring";

export function TabRail({
  tabDividers,
  activeTabId,
  onSelect,
}: {
  tabDividers: TabDivider[];
  activeTabId: string | null;
  onSelect: (tabId: string) => void;
}) {
  const spring = useSpring();

  return (
    <div className="flex flex-col gap-1 py-4">
      {tabDividers.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <motion.button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            whileTap={{ scale: 0.94 }}
            animate={{ x: active ? 4 : 0, backgroundColor: active ? tab.color : "rgba(0,0,0,0)" }}
            transition={spring.fast}
            className="group flex items-center gap-2 rounded-r-[var(--radius-base)] py-2 pl-2 pr-3 text-left text-sm"
            style={{ color: active ? "#fff" : "var(--color-text-muted)" }}
          >
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: active ? "#fff" : tab.color }}
            />
            {tab.label}
          </motion.button>
        );
      })}
    </div>
  );
}
