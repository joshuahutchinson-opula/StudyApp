import { CanvasTexture, SRGBColorSpace } from "three";

// Poly Haven has no real photographed paper texture (see
// public/textures/SOURCES.md) — this generates one at runtime instead,
// same established pattern as TimerObject's canvas digit face. `mirror`
// flips the margin line to the right edge, for a two-page spread's outer
// (right-hand) page.
export function createRuledPaperTexture(mirror = false): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f3ecdc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faint paper-fiber noise so it doesn't read as a flat digital fill.
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(${120 + Math.random() * 40},${110 + Math.random() * 30},${80 + Math.random() * 20},${0.02 + Math.random() * 0.03})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 1.5);
  }

  ctx.strokeStyle = "rgba(70,110,140,0.35)";
  ctx.lineWidth = 1.5;
  for (let y = 60; y < canvas.height - 20; y += 34) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }

  const marginX = mirror ? canvas.width - 56 : 56;
  ctx.strokeStyle = "rgba(180,60,60,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, 10);
  ctx.lineTo(marginX, canvas.height - 10);
  ctx.stroke();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// A static decorative diagram for the whiteboard object — the same spirit
// as the Claude Design reference render's sketched differential-diagnosis
// board, redrawn here as an actual canvas texture (not a downloaded image)
// since it needs to exist as a real, inspectable draw call, same pattern as
// the ruled-paper texture above and the timer's digit face.
export function createWhiteboardDiagramTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f4f3ee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#1d2b33";
  ctx.lineWidth = 3;
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillStyle = "#5b6a70";
  ctx.fillText("54F · sudden dyspnea, 2h", 40, 48);

  ctx.font = "600 26px Georgia, serif";
  ctx.strokeRect(360, 20, 300, 60);
  ctx.fillStyle = "#0f2027";
  ctx.textAlign = "center";
  ctx.fillText("Acute dyspnea", 510, 58);

  ctx.beginPath();
  ctx.moveTo(510, 80);
  ctx.lineTo(510, 120);
  ctx.moveTo(160, 120);
  ctx.lineTo(860, 120);
  ctx.moveTo(160, 120);
  ctx.lineTo(160, 150);
  ctx.moveTo(510, 120);
  ctx.lineTo(510, 150);
  ctx.moveTo(860, 120);
  ctx.lineTo(860, 150);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = "600 20px Inter, sans-serif";
  ctx.fillStyle = "#0f2027";
  ctx.fillText("CARDIAC", 160, 178);
  ctx.fillText("PULMONARY", 510, 178);
  ctx.fillText("OTHER", 860, 178);

  ctx.font = "italic 22px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#1d2b33";
  const cols: [number, string[]][] = [
    [40, ["Heart failure *", "Tamponade *", "Arrhythmia"]],
    [400, ["Pulmonary embolism *", "Pneumothorax *", "Pneumonia"]],
    [740, ["Anemia", "Anxiety", "Metabolic acidosis"]],
  ];
  for (const [x, lines] of cols) {
    lines.forEach((line, i) => ctx.fillText(line, x, 230 + i * 32));
  }

  ctx.strokeStyle = "rgba(184,65,58,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(120, 222, 90, 16, -0.05, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(15,32,39,0.15)";
  ctx.beginPath();
  ctx.moveTo(40, 340);
  ctx.lineTo(940, 340);
  ctx.stroke();

  ctx.font = "italic 22px Georgia, serif";
  ctx.fillStyle = "#2d7d8e";
  ctx.fillText("CXR + ECG first  →  BNP if equivocal", 40, 380);
  ctx.fillText("Wells score  →  CTPA if high-risk", 40, 412);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
