import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { usePbrMaps, pbrMaterialProps } from "../materials";
import { createWhiteboardDiagramTexture } from "../canvasTextures";
import type { DeskTheme } from "../disciplineTheme";

const BOARD_WIDTH = 1.6;
const BOARD_HEIGHT = 1.0;
const FRAME_DEPTH = 0.04;
const FRAME_BORDER = 0.045;

/**
 * Asset pass, item 6: a frame around the writing surface (four thin metal
 * bars, not a bare plane), two mounting clips at the bottom edge, and a
 * real sketched diagram as the surface texture (createWhiteboardDiagramTexture
 * — reuses the differential-diagnosis-board content style from the Claude
 * Design reference render, redrawn as a genuine canvas texture).
 */
export function WhiteboardObject({
  position,
  theme,
  onSelect,
}: {
  position: readonly [number, number, number];
  theme: DeskTheme;
  onSelect: () => void;
}) {
  const metal = usePbrMaps("metal_plate", [1, 1]);
  const diagram = useMemo(() => createWhiteboardDiagramTexture(), []);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    onSelect();
  }
  function handleOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  }
  function handleOut() {
    document.body.style.cursor = "auto";
  }

  return (
    <group position={position} onClick={handleClick} onPointerOver={handleOver} onPointerOut={handleOut}>
      {/* Writing surface */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOARD_WIDTH - FRAME_BORDER, BOARD_HEIGHT - FRAME_BORDER, 0.015]} />
        <meshStandardMaterial map={diagram} color={theme.whiteboard} roughness={0.55} />
      </mesh>

      {/* Frame — four thin bars, real metal PBR */}
      {[
        { pos: [0, BOARD_HEIGHT / 2 - FRAME_BORDER / 2, -0.005] as const, size: [BOARD_WIDTH, FRAME_BORDER, FRAME_DEPTH] as const },
        { pos: [0, -BOARD_HEIGHT / 2 + FRAME_BORDER / 2, -0.005] as const, size: [BOARD_WIDTH, FRAME_BORDER, FRAME_DEPTH] as const },
        { pos: [-BOARD_WIDTH / 2 + FRAME_BORDER / 2, 0, -0.005] as const, size: [FRAME_BORDER, BOARD_HEIGHT, FRAME_DEPTH] as const },
        { pos: [BOARD_WIDTH / 2 - FRAME_BORDER / 2, 0, -0.005] as const, size: [FRAME_BORDER, BOARD_HEIGHT, FRAME_DEPTH] as const },
      ].map((bar, i) => (
        <mesh key={i} position={bar.pos} castShadow receiveShadow>
          <boxGeometry args={bar.size} />
          <meshStandardMaterial {...pbrMaterialProps(metal)} color="#c7cdd1" roughness={1} metalness={1} />
        </mesh>
      ))}

      {/* Mounting clips, bottom edge */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, -BOARD_HEIGHT / 2 - 0.02, 0.01]} castShadow>
          <boxGeometry args={[0.06, 0.035, 0.03]} />
          <meshStandardMaterial {...pbrMaterialProps(metal)} color="#8a8f92" roughness={1} metalness={1} />
        </mesh>
      ))}

      {/* Eraser tray */}
      <mesh position={[0, -BOARD_HEIGHT / 2 - 0.01, 0.03]} castShadow>
        <boxGeometry args={[BOARD_WIDTH * 0.4, 0.02, 0.05]} />
        <meshStandardMaterial {...pbrMaterialProps(metal)} color="#9aa0a3" roughness={1} metalness={1} />
      </mesh>
    </group>
  );
}
