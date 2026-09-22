import type { TabDivider } from "@the-desk/shared";

export function TabRail({
  tabDividers,
  activeTabId,
  onSelect,
}: {
  tabDividers: TabDivider[];
  activeTabId: string | null;
  onSelect: (tabId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 py-4">
      {tabDividers.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className="group flex items-center gap-2 rounded-r-[var(--radius-base)] py-2 pl-2 pr-3 text-left text-sm transition-transform"
            style={{
              background: active ? tab.color : "transparent",
              color: active ? "#fff" : "var(--color-text-muted)",
              transform: active ? "translateX(4px)" : "translateX(0)",
            }}
          >
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: active ? "#fff" : tab.color }}
            />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
