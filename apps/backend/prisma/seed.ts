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
        sourcePageId: hfrefPage.id,
        front: "EF cutoff that defines HFrEF vs HFpEF?",
        back: "HFrEF: EF ≤ 40%. HFpEF: EF ≥ 50% (41-49% is HFmrEF).",
        dueAt: dueNow,
      },
      {
        userId: DEMO_USER_ID,
        sourcePageId: gdmtPage.id,
        front: "Name the four pillars of GDMT in HFrEF.",
        back: "ARNI (or ACEi/ARB), beta-blocker, MRA, SGLT2 inhibitor — started in parallel, not sequentially.",
        dueAt: dueNow,
      },
      {
        userId: DEMO_USER_ID,
        sourcePageId: afibPage.id,
        front: "What two risk scores are calculated for new-onset AFib?",
        back: "CHA2DS2-VASc (stroke risk) and HAS-BLED (bleeding risk).",
        dueAt: dueNow,
      },
    ],
  });

  console.log(`Seeded demo Medicine binder ${binder.id} for user ${DEMO_USER_ID}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
