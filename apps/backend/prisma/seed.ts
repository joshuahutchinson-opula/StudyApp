import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_USER_ID } from "@the-desk/shared";

const db = new PrismaClient();
export const DEMO_PASSWORD = "StudyDesk123!";

function heading(level: 1 | 2 | 3, text: string) {
  return { id: randomUUID(), kind: "heading" as const, level, text };
}
function paragraph(text: string) {
  return { id: randomUUID(), kind: "paragraph" as const, text };
}
function list(ordered: boolean, items: string[]) {
  return { id: randomUUID(), kind: "list" as const, ordered, items };
}
function code(language: string, codeText: string, runnable = false) {
  return { id: randomUUID(), kind: "code" as const, language, code: codeText, runnable };
}
function citationRef(citationId: string) {
  return { id: randomUUID(), kind: "citationRef" as const, citationId };
}
function formula(expression: string) {
  return { id: randomUUID(), kind: "formula" as const, expression };
}
function image(url: string, caption?: string) {
  return { id: randomUUID(), kind: "image" as const, url, caption };
}

// A simple constructed line-art sketch (doorway + figure silhouette) as a
// data URI — no external image dependency, matching the "doorway as
// frame-within-frame" motif already established in the Arts seed content.
const DOORWAY_SKETCH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <rect width="640" height="480" fill="#f4f1ea"/>
  <rect x="220" y="80" width="200" height="320" fill="none" stroke="#2a2a2a" stroke-width="3"/>
  <rect x="250" y="110" width="140" height="260" fill="none" stroke="#2a2a2a" stroke-width="2" opacity="0.6"/>
  <line x1="120" y1="400" x2="520" y2="400" stroke="#2a2a2a" stroke-width="2"/>
  <line x1="120" y1="400" x2="220" y2="400" stroke="#2a2a2a" stroke-width="1.5"/>
  <line x1="420" y1="400" x2="520" y2="400" stroke="#2a2a2a" stroke-width="1.5"/>
  <line x1="220" y1="80" x2="120" y2="60" stroke="#2a2a2a" stroke-width="1" opacity="0.5"/>
  <line x1="420" y1="80" x2="520" y2="60" stroke="#2a2a2a" stroke-width="1" opacity="0.5"/>
  <ellipse cx="320" cy="240" rx="18" ry="24" fill="#2a2a2a" opacity="0.7"/>
  <rect x="302" y="264" width="36" height="90" fill="#2a2a2a" opacity="0.7"/>
</svg>`;
const doorwaySketchUrl = `data:image/svg+xml;base64,${Buffer.from(DOORWAY_SKETCH_SVG).toString("base64")}`;

async function seedMedicine() {
  const existing = await db.binder.findFirst({
    where: { userId: DEMO_USER_ID, discipline: "medicine" },
  });
  if (existing) {
    console.log("Demo Medicine binder already exists, skipping seed.");
    return;
  }

  const binder = await db.binder.create({
    data: {
      userId: DEMO_USER_ID,
      discipline: "medicine",
      title: "Cardiology Rotation",
    },
  });

  const heartFailure = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Heart Failure", color: "#0b3d4c", order: 0 },
  });
  const arrhythmias = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Arrhythmias", color: "#1f7a6c", order: 1 },
  });
  const valvular = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Valvular Disease", color: "#4b8fa6", order: 2 },
  });

  const hfGuideline = await db.citation.create({
    data: {
      userId: DEMO_USER_ID,
      discipline: "medicine",
      style: "ama",
      sourceType: "article",
      title: "2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure",
      authors: ["Paul A. Heidenreich", "Biykem Bozkurt", "David Aguilar"],
      year: 2022,
      publisher: "Circulation",
      doi: "10.1161/CIR.0000000000001063",
    },
  });

  const hfrefPage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: heartFailure.id,
      title: "HFrEF vs HFpEF",
      order: 0, // sequential across the whole binder, not per-tab — flat next/prev order
      masteryLevel: "learning",
      reviewed: true,
      content: [
        heading(1, "HFrEF vs HFpEF"),
        paragraph(
          "Heart failure is classified by ejection fraction: HFrEF (reduced, EF ≤40%) reflects impaired contractility, while HFpEF (preserved, EF ≥50%) reflects impaired relaxation/filling.",
        ),
        heading(2, "Key distinguishing features"),
        list(false, [
          "HFrEF: dilated LV, S3 gallop, more responsive to GDMT (ACEi/ARNI, beta-blocker, MRA, SGLT2i)",
          "HFpEF: often hypertensive, diastolic dysfunction on echo, LVH, less robust mortality benefit from classic GDMT",
        ]),
        citationRef(hfGuideline.id),
      ],
    },
  });

  const gdmtPage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: heartFailure.id,
      title: "Guideline-Directed Medical Therapy",
      order: 1,
      masteryLevel: "unfamiliar",
      reviewed: false,
      content: [
        heading(1, "GDMT: the four pillars"),
        list(true, [
          "ARNI (or ACEi/ARB if ARNI unavailable)",
          "Beta-blocker (bisoprolol, carvedilol, metoprolol succinate)",
          "Mineralocorticoid receptor antagonist (spironolactone, eplerenone)",
          "SGLT2 inhibitor (dapagliflozin, empagliflozin)",
        ]),
        paragraph("All four classes reduce mortality in HFrEF independently — the modern approach starts them in parallel rather than sequentially titrating one at a time."),
      ],
    },
  });

  const afibPage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: arrhythmias.id,
      title: "Atrial Fibrillation Workup",
      order: 2,
      masteryLevel: "familiar",
      reviewed: true,
      content: [
        heading(1, "New-onset AFib workup"),
        list(false, [
          "12-lead ECG to confirm rhythm",
          "TSH, CBC, BMP, echocardiogram",
          "CHA2DS2-VASc for stroke risk, HAS-BLED for bleeding risk",
        ]),
        paragraph("Rate vs. rhythm control depends on symptoms, duration, and LV function — rhythm control is generally preferred in HFrEF."),
      ],
    },
  });

  await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: valvular.id,
      title: "Aortic Stenosis Severity",
      order: 3,
      masteryLevel: "mastered",
      reviewed: true,
      content: [
        heading(1, "Grading severe AS"),
        list(false, [
          "Aortic valve area < 1.0 cm²",
          "Mean gradient > 40 mmHg",
          "Peak jet velocity > 4 m/s",
        ]),
        paragraph("Symptomatic severe AS (angina, syncope, heart failure) is a class I indication for valve replacement (SAVR or TAVR)."),
      ],
    },
  });

  const dueNow = new Date(Date.now() - 60 * 60 * 1000); // 1h in the past, so it's immediately due

  await db.spacedRepetitionCard.createMany({
    data: [
      {
        userId: DEMO_USER_ID,
        discipline: "medicine",
        sourcePageId: hfrefPage.id,
        front: "EF cutoff that defines HFrEF vs HFpEF?",
        back: "HFrEF: EF ≤ 40%. HFpEF: EF ≥ 50% (41-49% is HFmrEF).",
        dueAt: dueNow,
      },
      {
        userId: DEMO_USER_ID,
        discipline: "medicine",
        sourcePageId: gdmtPage.id,
        front: "Name the four pillars of GDMT in HFrEF.",
        back: "ARNI (or ACEi/ARB), beta-blocker, MRA, SGLT2 inhibitor — started in parallel, not sequentially.",
        dueAt: dueNow,
      },
      {
        userId: DEMO_USER_ID,
        discipline: "medicine",
        sourcePageId: afibPage.id,
        front: "What two risk scores are calculated for new-onset AFib?",
        back: "CHA2DS2-VASc (stroke risk) and HAS-BLED (bleeding risk).",
        dueAt: dueNow,
      },
    ],
  });

  const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  await db.task.createMany({
    data: [
      { userId: DEMO_USER_ID, discipline: "medicine", title: "Write up SOAP note for bed 4", status: "todo", dueAt: inDays(1) },
      { userId: DEMO_USER_ID, discipline: "medicine", title: "Read up on HFpEF trials (DELIVER, EMPEROR-Preserved)", status: "todo", dueAt: inDays(3) },
      { userId: DEMO_USER_ID, discipline: "medicine", title: "Prep differential for tomorrow's case presentation", status: "in_progress", dueAt: inDays(1) },
      { userId: DEMO_USER_ID, discipline: "medicine", title: "Shadow echo read with attending", status: "backlog", dueAt: null },
      { userId: DEMO_USER_ID, discipline: "medicine", title: "Submit rotation self-evaluation", status: "done", dueAt: inDays(-2) },
    ],
  });

  await db.deadline.createMany({
    data: [
      { userId: DEMO_USER_ID, title: "Cardiology shelf exam", dueAt: inDays(9), source: "manual" },
      { userId: DEMO_USER_ID, title: "Case presentation due", dueAt: inDays(1), source: "manual" },
      { userId: DEMO_USER_ID, title: "Rotation evaluation deadline", dueAt: inDays(14), source: "manual" },
    ],
  });

  await db.clinicalCase.create({
    data: {
      title: "Progressive dyspnea in a 68-year-old",
      vignette:
        "A 68-year-old man with a history of hypertension and prior MI presents with 2 weeks of worsening shortness of breath on exertion, orthopnea (now sleeping on 3 pillows), and bilateral ankle swelling. He denies fever or cough. Vitals: BP 148/92, HR 98, RR 22, SpO2 91% on room air. Exam: elevated JVP, bibasilar crackles, 2+ pitting edema to the shins, no murmurs.",
      differentialOptions: [
        { label: "Acute decompensated heart failure", weight: "primary" },
        { label: "COPD exacerbation", weight: "reasonable" },
        { label: "Pulmonary embolism", weight: "reasonable" },
        { label: "Community-acquired pneumonia", weight: "unlikely" },
        { label: "Anemia", weight: "unlikely" },
      ] satisfies { label: string; weight: "primary" | "reasonable" | "unlikely" }[],
      testOptions: [
        { label: "BNP or NT-proBNP", indicated: true },
        { label: "Transthoracic echocardiogram", indicated: true },
        { label: "Chest X-ray", indicated: true },
        { label: "ECG", indicated: true },
        { label: "Basic metabolic panel", indicated: true },
        { label: "D-dimer", indicated: false },
        { label: "CT pulmonary angiogram", indicated: false },
        { label: "Sputum culture", indicated: false },
      ] satisfies { label: string; indicated: boolean }[],
    },
  });

  console.log(`Seeded demo Medicine binder ${binder.id} for user ${DEMO_USER_ID}`);
}

// Stress-tests the same binder system Medicine uses with zero binder-specific
// code changes — only different seed content and a `runnable` code block.
async function seedSoftware() {
  const existing = await db.binder.findFirst({
    where: { userId: DEMO_USER_ID, discipline: "software" },
  });
  if (existing) {
    console.log("Demo Software binder already exists, skipping seed.");
    return;
  }

  const binder = await db.binder.create({
    data: {
      userId: DEMO_USER_ID,
      discipline: "software",
      title: "Systems & Algorithms",
    },
  });

  const dataStructures = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Data Structures", color: "#5eead4", order: 0 },
  });
  const asyncJs = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Async JS", color: "#7dd3fc", order: 1 },
  });
  const systemsDesign = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Systems Design", color: "#c084fc", order: 2 },
  });

  const bsearchPage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: dataStructures.id,
      title: "Binary Search",
      order: 0,
      masteryLevel: "familiar",
      reviewed: true,
      content: [
        heading(1, "Binary Search"),
        paragraph("O(log n) search on a sorted array — halve the search space each iteration instead of scanning linearly."),
        code(
          "javascript",
          `function binarySearch(sorted, target) {
  let lo = 0, hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}
binarySearch([1, 3, 5, 7, 9, 11], 7);`,
          true,
        ),
      ],
    },
  });

  const debouncePage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: asyncJs.id,
      title: "Debounce",
      order: 1,
      masteryLevel: "learning",
      reviewed: false,
      content: [
        heading(1, "Debounce"),
        paragraph("Delays invoking a function until it's stopped being called for `wait` ms — collapses bursts of events (typing, resize) into one call."),
        code(
          "javascript",
          `function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
// try it: logs once, not three times, after the delay
const log = debounce((msg) => console.log(msg), 50);
log("a"); log("b"); log("c");
"debounce defined";`,
          true,
        ),
      ],
    },
  });

  await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: systemsDesign.id,
      title: "Cache Invalidation Strategies",
      order: 2,
      masteryLevel: "unfamiliar",
      reviewed: false,
      content: [
        heading(1, "Cache invalidation strategies"),
        list(false, [
          "TTL — simplest, but can serve stale data until expiry",
          "Write-through — cache updated synchronously with the write, always fresh, higher write latency",
          "Write-behind — cache updated immediately, DB updated async, risk of data loss on crash",
          "Event-driven invalidation — publish an invalidation event on write, subscribers evict the key",
        ]),
      ],
    },
  });

  const dueNow = new Date(Date.now() - 60 * 60 * 1000);
  await db.spacedRepetitionCard.createMany({
    data: [
      {
        userId: DEMO_USER_ID,
        discipline: "software",
        sourcePageId: bsearchPage.id,
        front: "Time complexity of binary search, and its precondition?",
        back: "O(log n) — requires the input to already be sorted.",
        dueAt: dueNow,
      },
      {
        userId: DEMO_USER_ID,
        discipline: "software",
        sourcePageId: debouncePage.id,
        front: "Debounce vs throttle — what's the difference?",
        back: "Debounce waits for a quiet period before firing once; throttle fires at most once per fixed interval regardless of quiet periods.",
        dueAt: dueNow,
      },
    ],
  });

  const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  await db.task.createMany({
    data: [
      { userId: DEMO_USER_ID, discipline: "software", title: "Implement rate limiter for /api/search", status: "todo", dueAt: inDays(2) },
      { userId: DEMO_USER_ID, discipline: "software", title: "Review PR #142 (auth refactor)", status: "in_progress", dueAt: inDays(1) },
      { userId: DEMO_USER_ID, discipline: "software", title: "Write unit tests for debounce util", status: "backlog", dueAt: null },
      { userId: DEMO_USER_ID, discipline: "software", title: "Set up CI cache for node_modules", status: "done", dueAt: inDays(-3) },
    ],
  });

  await db.citation.create({
    data: {
      userId: DEMO_USER_ID,
      discipline: "software",
      style: "ieee",
      sourceType: "conference_paper",
      title: "The Byzantine Generals Problem",
      authors: ["Leslie Lamport", "Robert Shostak", "Marshall Pease"],
      year: 1982,
      publisher: "ACM Transactions on Programming Languages and Systems",
    },
  });

  console.log(`Seeded demo Software binder ${binder.id} for user ${DEMO_USER_ID}`);
}

// Completes the five-discipline picture with minimal but real content — not a
// flagship build (no signature feature yet), just enough to prove the same
// binder/planner/spaced-repetition spine holds up here too.
async function seedWriting() {
  const existing = await db.binder.findFirst({ where: { userId: DEMO_USER_ID, discipline: "writing" } });
  if (existing) {
    console.log("Demo Writing binder already exists, skipping seed.");
    return;
  }

  const binder = await db.binder.create({
    data: { userId: DEMO_USER_ID, discipline: "writing", title: "The Long-Form Desk" },
  });

  const drafts = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Drafts", color: "#a3512b", order: 0 },
  });
  const sources = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Interviews & Sources", color: "#6b6255", order: 1 },
  });
  const pitches = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Pitches", color: "#3d3226", order: 2 },
  });

  const draftPage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: drafts.id,
      title: "Draft 2 — Opening",
      order: 0,
      masteryLevel: "learning",
      reviewed: true,
      content: [
        heading(1, "The Last Print Run"),
        paragraph(
          "The press at Fifth Street ran for the final time on a Tuesday, and nobody thought to take a photo until it had already stopped.",
        ),
        paragraph(
          "Draft note: open on the sound, not the fact — readers need to feel the machine before they're told what it means.",
        ),
      ],
    },
  });

  const interviewPage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: sources.id,
      title: "Interview Log — M. Alvarez, pressroom foreman",
      order: 1,
      masteryLevel: "familiar",
      reviewed: true,
      content: [
        heading(1, "M. Alvarez — 22 years on the floor"),
        list(false, [
          "On the last run: \"You could hear it slowing down before the readout said anything.\"",
          "On the crew: 14 people, 6 kept on for digital prepress, rest laid off",
          "Follow-up needed: get exact final page count for the record",
        ]),
      ],
    },
  });

  await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: pitches.id,
      title: "Pitch — Regional desk",
      order: 2,
      masteryLevel: "unfamiliar",
      reviewed: false,
      content: [
        heading(1, "Pitch: \"The Last Print Run\""),
        paragraph(
          "1,800 words, feature. The closure of the Fifth Street press as a lens on what a town loses when the paper stops printing — not just jobs, the physical object.",
        ),
        list(true, ["Lead: pressroom on final night", "Turn: what digital-only actually cost the paper's reach", "Kicker: foreman's line about the readout"]),
      ],
    },
  });

  const dueNow = new Date(Date.now() - 60 * 60 * 1000);
  await db.spacedRepetitionCard.createMany({
    data: [
      {
        userId: DEMO_USER_ID,
        discipline: "writing",
        sourcePageId: draftPage.id,
        front: "What's the note-to-self on this draft's opening?",
        back: "Open on the sound/sensory detail, not the bare fact — let the reader feel it before naming what it means.",
        dueAt: dueNow,
      },
      {
        userId: DEMO_USER_ID,
        discipline: "writing",
        sourcePageId: interviewPage.id,
        front: "How many of the 14-person crew were kept on after the closure?",
        back: "6, moved to digital prepress.",
        dueAt: dueNow,
      },
    ],
  });

  const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  await db.task.createMany({
    data: [
      { userId: DEMO_USER_ID, discipline: "writing", title: "Follow up with Alvarez for final page count", status: "todo", dueAt: inDays(2) },
      { userId: DEMO_USER_ID, discipline: "writing", title: "Fact-check crew headcount with HR contact", status: "in_progress", dueAt: inDays(4) },
      { userId: DEMO_USER_ID, discipline: "writing", title: "Send pitch to regional desk", status: "backlog", dueAt: inDays(7) },
      { userId: DEMO_USER_ID, discipline: "writing", title: "Transcribe Alvarez interview", status: "done", dueAt: inDays(-5) },
    ],
  });

  await db.citation.create({
    data: {
      userId: DEMO_USER_ID,
      discipline: "writing",
      style: "chicago",
      sourceType: "book",
      title: "The Associated Press Stylebook",
      authors: ["Associated Press"],
      year: 2023,
      publisher: "Associated Press",
    },
  });

  console.log(`Seeded demo Writing binder ${binder.id} for user ${DEMO_USER_ID}`);
}

async function seedEngineering() {
  const existing = await db.binder.findFirst({
    where: { userId: DEMO_USER_ID, discipline: "engineering" },
  });
  if (existing) {
    console.log("Demo Engineering binder already exists, skipping seed.");
    return;
  }

  const binder = await db.binder.create({
    data: { userId: DEMO_USER_ID, discipline: "engineering", title: "Structural Analysis I" },
  });

  const statics = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Statics", color: "#2b6cb0", order: 0 },
  });
  const materials = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Materials", color: "#4d5a70", order: 1 },
  });
  const codes = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Standards & Codes", color: "#14335e", order: 2 },
  });

  const equilibriumPage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: statics.id,
      title: "Beam Equilibrium",
      order: 0,
      masteryLevel: "learning",
      reviewed: true,
      content: [
        heading(1, "Static equilibrium of a simply supported beam"),
        paragraph("For a rigid body at rest, the sum of forces and the sum of moments about any point must each equal zero."),
        list(false, ["ΣFx = 0", "ΣFy = 0", "ΣM = 0 (about any chosen point)"]),
        paragraph("For a simply supported beam with a point load, reactions are found by taking moments about one support to eliminate its reaction term first."),
        paragraph("Live example — 10 kN point load, 4 m span, 1.5 m from the left support:"),
        formula("P = 10 kN\nL = 4 m\na = 1.5 m\nR1 = P * (L - a) / L\nR2 = P * a / L"),
      ],
    },
  });

  const stressStrainPage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: materials.id,
      title: "Stress–Strain Behavior",
      order: 1,
      masteryLevel: "unfamiliar",
      reviewed: false,
      content: [
        heading(1, "Stress–strain curve — key points"),
        list(false, [
          "Elastic region: stress ∝ strain, slope = Young's modulus (E)",
          "Yield point: onset of permanent (plastic) deformation",
          "Ultimate tensile strength: maximum stress the material sustains",
          "Fracture point: where the material breaks",
        ]),
        paragraph("Working (allowable) stress is kept well below yield, using a safety factor set by the applicable code — not by engineering judgment alone."),
        paragraph("Live example — axial stress from a 15 kN load on a 300 mm² cross-section:"),
        formula("F = 15 kN\nA = 300 mm^2\nsigma = F / A\nsigma to MPa"),
        paragraph("Unit-mismatch is flagged, not silently coerced — e.g. trying to add a force to a time:"),
        formula("F = 15 kN\nt = 2 s\nF + t"),
      ],
    },
  });

  await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: codes.id,
      title: "Load Combinations (ASCE 7 reference)",
      order: 2,
      masteryLevel: "familiar",
      reviewed: true,
      content: [
        heading(1, "LRFD basic load combinations"),
        list(true, [
          "1.4D",
          "1.2D + 1.6L + 0.5(Lr or S or R)",
          "1.2D + 1.6(Lr or S or R) + (L or 0.5W)",
          "1.2D + 1.0W + L + 0.5(Lr or S or R)",
        ]),
        paragraph("D = dead load, L = live load, Lr = roof live load, S = snow, R = rain, W = wind — use the governing (largest) combination for design."),
      ],
    },
  });

  const dueNow = new Date(Date.now() - 60 * 60 * 1000);
  await db.spacedRepetitionCard.createMany({
    data: [
      {
        userId: DEMO_USER_ID,
        discipline: "engineering",
        sourcePageId: equilibriumPage.id,
        front: "The three equilibrium equations for a rigid body in 2D?",
        back: "ΣFx = 0, ΣFy = 0, ΣM = 0 (about any point).",
        dueAt: dueNow,
      },
      {
        userId: DEMO_USER_ID,
        discipline: "engineering",
        sourcePageId: stressStrainPage.id,
        front: "What does the slope of the elastic region of a stress-strain curve represent?",
        back: "Young's modulus (E) — the material's stiffness.",
        dueAt: dueNow,
      },
    ],
  });

  const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  await db.task.createMany({
    data: [
      { userId: DEMO_USER_ID, discipline: "engineering", title: "Problem set 4 — beam reactions", status: "todo", dueAt: inDays(3) },
      { userId: DEMO_USER_ID, discipline: "engineering", title: "Lab report — tensile test data", status: "in_progress", dueAt: inDays(1) },
      { userId: DEMO_USER_ID, discipline: "engineering", title: "Read ASCE 7 chapter 2", status: "backlog", dueAt: null },
      { userId: DEMO_USER_ID, discipline: "engineering", title: "Statics quiz review", status: "done", dueAt: inDays(-4) },
    ],
  });

  await db.citation.create({
    data: {
      userId: DEMO_USER_ID,
      discipline: "engineering",
      style: "ieee",
      sourceType: "other",
      title: "ASCE/SEI 7-22: Minimum Design Loads and Associated Criteria for Buildings and Other Structures",
      authors: ["American Society of Civil Engineers"],
      year: 2022,
      publisher: "ASCE",
    },
  });

  console.log(`Seeded demo Engineering binder ${binder.id} for user ${DEMO_USER_ID}`);
}

async function seedArts() {
  const existing = await db.binder.findFirst({ where: { userId: DEMO_USER_ID, discipline: "arts" } });
  if (existing) {
    console.log("Demo Arts binder already exists, skipping seed.");
    return;
  }

  const binder = await db.binder.create({
    data: { userId: DEMO_USER_ID, discipline: "arts", title: "Studio Practice — Senior Year" },
  });

  const sketchbook = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Sketchbook", color: "#c1432c", order: 0 },
  });
  const critique = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Critique Notes", color: "#1a1a1a", order: 1 },
  });
  const statement = await db.tabDivider.create({
    data: { binderId: binder.id, label: "Artist Statement", color: "#5c5c5c", order: 2 },
  });

  const sketchPage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: sketchbook.id,
      title: "Thumbnails — series 3",
      order: 0,
      masteryLevel: "learning",
      reviewed: false,
      content: [
        heading(1, "Series 3 — thumbnails"),
        paragraph("Working smaller and faster this round — six thumbnails before committing to a composition, instead of one."),
        list(false, [
          "Thumb 4 has the strongest negative space — worth developing",
          "Recurring motif: the doorway as frame-within-frame",
        ]),
        image(doorwaySketchUrl, "Thumb 4 — doorway study, ink"),
      ],
    },
  });

  const critiquePage = await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: critique.id,
      title: "Group Critique — Week 6",
      order: 1,
      masteryLevel: "familiar",
      reviewed: true,
      content: [
        heading(1, "Critique notes — Week 6"),
        list(false, [
          "Consensus: the palette reads as too uniform across the series — needs one outlier piece",
          "J. Kwan: the doorway motif is legible without being repetitive, keep it",
          "Prof: push the scale on at least one piece before the review",
        ]),
      ],
    },
  });

  await db.page.create({
    data: {
      binderId: binder.id,
      tabDividerId: statement.id,
      title: "Artist Statement — draft",
      order: 2,
      masteryLevel: "unfamiliar",
      reviewed: false,
      content: [
        heading(1, "Artist statement (draft)"),
        paragraph(
          "This series treats the doorway not as a threshold but as a held moment — neither inside nor outside, the space where a decision hasn't been made yet.",
        ),
        paragraph("Needs: cut the second paragraph, it explains too much. Statement should raise the question the work asks, not answer it."),
      ],
    },
  });

  const dueNow = new Date(Date.now() - 60 * 60 * 1000);
  await db.spacedRepetitionCard.createMany({
    data: [
      {
        userId: DEMO_USER_ID,
        discipline: "arts",
        sourcePageId: sketchPage.id,
        front: "What's the recurring motif across series 3?",
        back: "The doorway, used as a frame-within-frame.",
        dueAt: dueNow,
      },
      {
        userId: DEMO_USER_ID,
        discipline: "arts",
        sourcePageId: critiquePage.id,
        front: "What was the group's main critique of the palette?",
        back: "Too uniform across the series — needs one outlier piece.",
        dueAt: dueNow,
      },
    ],
  });

  const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  await db.task.createMany({
    data: [
      { userId: DEMO_USER_ID, discipline: "arts", title: "Develop thumb 4 into full composition", status: "todo", dueAt: inDays(3) },
      { userId: DEMO_USER_ID, discipline: "arts", title: "Rework artist statement — cut paragraph 2", status: "in_progress", dueAt: inDays(2) },
      { userId: DEMO_USER_ID, discipline: "arts", title: "Photograph work for portfolio site", status: "backlog", dueAt: null },
      { userId: DEMO_USER_ID, discipline: "arts", title: "Order canvas for large-scale piece", status: "done", dueAt: inDays(-2) },
    ],
  });

  await db.citation.create({
    data: {
      userId: DEMO_USER_ID,
      discipline: "arts",
      style: "chicago",
      sourceType: "book",
      title: "Ways of Seeing",
      authors: ["John Berger"],
      year: 1972,
      publisher: "Penguin Books",
    },
  });

  console.log(`Seeded demo Arts binder ${binder.id} for user ${DEMO_USER_ID}`);
}

async function main() {
  await db.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "demo@thedesk.app",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      displayName: "Demo Student",
      activeDiscipline: "medicine",
    },
  });

  await seedMedicine();
  await seedSoftware();
  await seedWriting();
  await seedEngineering();
  await seedArts();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
