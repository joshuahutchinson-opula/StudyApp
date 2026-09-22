import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { DEMO_USER_ID } from "@the-desk/shared";

const db = new PrismaClient();

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

  console.log(`Seeded demo Software binder ${binder.id} for user ${DEMO_USER_ID}`);
}

async function main() {
  await db.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "demo@thedesk.app",
      displayName: "Demo Student",
      activeDiscipline: "medicine",
    },
  });

  await seedMedicine();
  await seedSoftware();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
