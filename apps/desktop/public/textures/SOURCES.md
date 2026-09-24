# Texture sources

All textures below are CC0 (public domain) from [Poly Haven](https://polyhaven.com), downloaded at 1k JPG resolution. Each folder has `diff.jpg` (albedo), `nor.jpg` (OpenGL-convention normal map), and `arm.jpg` (packed AO/Roughness/Metalness — R=AO, G=Roughness, B=Metalness, the standard "ARM" packing Poly Haven ships).

| Folder | Poly Haven asset | Used for |
|---|---|---|
| `dark_wood/` | [dark_wood](https://polyhaven.com/a/dark_wood) | Desk surface |
| `oak_veneer/` | [oak_veneer_02](https://polyhaven.com/a/oak_veneer_02) | Bookshelf |
| `leather_white/` | [leather_white](https://polyhaven.com/a/leather_white) | Binder cover (neutral/light so it tints per discipline via `material.color`) |
| `painted_plaster_wall/` | [painted_plaster_wall](https://polyhaven.com/a/painted_plaster_wall) | Wall |
| `hessian/` | [hessian_230](https://polyhaven.com/a/hessian_230) | Corkboard surface — Poly Haven has no literal cork texture; burlap-covered pinboards are a real, common product, so this is a genuine material substitution, not a placeholder. |
| `metal_plate/` | [metal_plate_02](https://polyhaven.com/a/metal_plate_02) | Brass/metal hardware (ribbon, pins, lamp, timer casing) — Poly Haven's metal category is mostly industrial/rusty with no clean brass texture; tinting this plate's ARM map with a gold `material.color` is the standard way to fake brass from a neutral metal map when no photographed brass texture is available. |

`/hdri/studio.hdr` — [brown_photostudio_02](https://polyhaven.com/a/brown_photostudio_02), 1k HDR, CC0. Warm-toned neutral studio environment for ambient fill/reflections, paired with the scene's one directional key light (the desk lamp).

Paper (planner pages, whiteboard surface) has no dedicated real-photo texture — Poly Haven doesn't have one — so those are canvas-generated at runtime (same established pattern as the timer's digit face and existing SVG-drawn seed content), not a downloaded texture.
