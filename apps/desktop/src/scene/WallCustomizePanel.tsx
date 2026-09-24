import { Html } from "@react-three/drei";
import { DESK_WOOD_PRESETS, WALL_PRESETS, type DeskTheme } from "./disciplineTheme";
import { useUpdateDeskTheme } from "../features/preferences/api";

function Swatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: color,
        border: active ? "3px solid #2d7d8e" : "2px solid rgba(0,0,0,.15)",
        cursor: "pointer",
        padding: 0,
      }}
      aria-label={color}
    />
  );
}

/**
 * Tier 7's user desk/wall customization — same swap mechanism as Tier 5
 * (a DeskTheme lookup threaded through DeskAndWall/SceneObjects), just with
 * the value coming from a per-user override merged over the discipline
 * default instead of the discipline default alone. Scoped to desk wood +
 * wall color only, per the tier's own name ("desk/wall customization"), not
 * every object's color — that would blur into Tier 5's discipline identity,
 * which a user picking "I like blue" shouldn't be able to override away.
 */
export function WallCustomizePanel({
  position,
  theme,
}: {
  position: readonly [number, number, number];
  theme: DeskTheme;
}) {
  const updateDeskTheme = useUpdateDeskTheme();

  return (
    <Html position={position} transform distanceFactor={1.1} style={{ pointerEvents: "none" }}>
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: 300,
          pointerEvents: "auto",
          background: "#f6f1e5",
          borderRadius: 6,
          padding: "18px 22px",
          boxShadow: "0 14px 34px rgba(0,0,0,.4)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <p style={{ margin: "0 0 12px", fontSize: 11, letterSpacing: 1.4, color: "#2d7d8e", fontWeight: 600 }}>
          CUSTOMIZE YOUR DESK
        </p>

        <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b6255" }}>Wall color</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {WALL_PRESETS.map((color) => (
            <Swatch
              key={color}
              color={color}
              active={theme.wall === color}
              onClick={() => updateDeskTheme.mutate({ wall: color })}
            />
          ))}
        </div>

        <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6b6255" }}>Desk wood</p>
        <div style={{ display: "flex", gap: 10 }}>
          {DESK_WOOD_PRESETS.map((color) => (
            <Swatch
              key={color}
              color={color}
              active={theme.deskWood === color}
              onClick={() => updateDeskTheme.mutate({ deskWood: color })}
            />
          ))}
        </div>
      </div>
    </Html>
  );
}
