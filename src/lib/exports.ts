import type { Meeting } from "@/types/meeting";

export function buildReportText(m: Meeting): string {
  return [
    m.title, "=".repeat(m.title.length), "",
    "SUMMARY", m.summary ?? "", "",
    "DECISIONS", ...(m.decisions ?? []).map(d => `• ${d}`), "",
    "ACTION ITEMS",
    ...(m.action_items ?? []).map(a => `• ${a.title} — ${a.owner} (due ${a.due}) [${a.status}]`), "",
    "SCOPE OF WORK", m.scope_of_work ?? "", "",
    "TIMELINE",
    ...(m.timeline ?? []).map(t => `${t.date} — ${t.milestone}`),
  ].join("\n");
}

export function downloadText(m: Meeting) {
  const blob = new Blob([buildReportText(m)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${safe(m.title)}.txt`; a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPpt(m: Meeting) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pptx.title = m.title;

  const BG = "0A0A12";
  const FG = "FFFFFF";
  const MUTED = "A0A0B0";
  const ACCENT = "8B5CF6";

  const slide = (title: string, build: (s: any) => void) => {
    const s = pptx.addSlide();
    s.background = { color: BG };
    s.addText(title, {
      x: 0.6, y: 0.4, w: 12, h: 0.8,
      fontSize: 32, bold: true, color: FG, fontFace: "Calibri",
    });
    s.addShape(pptx.ShapeType.line, {
      x: 0.6, y: 1.2, w: 1.2, h: 0,
      line: { color: ACCENT, width: 3 },
    });
    build(s);
  };

  // Title slide
  const t = pptx.addSlide();
  t.background = { color: BG };
  t.addText("Chronos Agent", { x: 0.6, y: 2.6, w: 12, h: 0.5, fontSize: 18, color: ACCENT, fontFace: "Calibri" });
  t.addText(m.title, { x: 0.6, y: 3.1, w: 12, h: 1.6, fontSize: 56, bold: true, color: FG, fontFace: "Calibri" });
  t.addText(new Date().toLocaleDateString(), { x: 0.6, y: 4.9, w: 12, h: 0.4, fontSize: 14, color: MUTED, fontFace: "Calibri" });

  // Summary
  slide("Summary", (s) => {
    s.addText(m.summary ?? "—", {
      x: 0.6, y: 1.6, w: 12, h: 5.4,
      fontSize: 18, color: FG, fontFace: "Calibri", valign: "top",
    });
  });

  // Decisions
  slide("Decisions", (s) => {
    const items = (m.decisions ?? []).map(d => ({ text: d, options: { bullet: true } }));
    s.addText(items.length ? items : [{ text: "—" }], {
      x: 0.6, y: 1.6, w: 12, h: 5.4, fontSize: 18, color: FG, fontFace: "Calibri", valign: "top",
    });
  });

  // Action Items
  slide("Action Items", (s) => {
    const rows = [[
      { text: "Task", options: { bold: true, fill: { color: "1A1A28" }, color: FG } },
      { text: "Owner", options: { bold: true, fill: { color: "1A1A28" }, color: FG } },
      { text: "Due", options: { bold: true, fill: { color: "1A1A28" }, color: FG } },
      { text: "Status", options: { bold: true, fill: { color: "1A1A28" }, color: FG } },
    ], ...(m.action_items ?? []).map(a => [
      { text: a.title, options: { color: FG } },
      { text: a.owner, options: { color: MUTED } },
      { text: a.due, options: { color: MUTED } },
      { text: a.status, options: { color: a.status === "confirmed" ? "34D399" : MUTED } },
    ])];
    s.addTable(rows, {
      x: 0.6, y: 1.6, w: 12, colW: [6, 2.2, 1.8, 2],
      fontSize: 14, fontFace: "Calibri", border: { type: "solid", color: "1A1A28", pt: 1 },
    });
  });

  // Timeline
  slide("Timeline", (s) => {
    const rows = (m.timeline ?? []).map(t => [
      { text: t.date, options: { bold: true, color: ACCENT } },
      { text: t.milestone, options: { color: FG } },
    ]);
    s.addTable(rows.length ? rows : [[{ text: "—" }, { text: "" }]], {
      x: 0.6, y: 1.6, w: 12, colW: [2.5, 9.5],
      fontSize: 16, fontFace: "Calibri", border: { type: "none" },
    });
  });

  // Scope
  slide("Scope of Work", (s) => {
    s.addText(m.scope_of_work ?? "—", {
      x: 0.6, y: 1.6, w: 12, h: 5.4,
      fontSize: 16, color: FG, fontFace: "Calibri", valign: "top",
    });
  });

  await pptx.writeFile({ fileName: `${safe(m.title)}.pptx` });
}

export function emailMailto(m: Meeting, to: string): string {
  const subject = encodeURIComponent(`Meeting notes: ${m.title}`);
  const body = encodeURIComponent(buildReportText(m));
  return `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
}

export async function postToSlack(m: Meeting, webhookUrl: string) {
  const lines = [
    `*${m.title}*`,
    "",
    `*Summary:* ${m.summary ?? "—"}`,
    "",
    `*Decisions:*\n${(m.decisions ?? []).map(d => `• ${d}`).join("\n") || "—"}`,
    "",
    `*Action items:*\n${(m.action_items ?? []).map(a => `• ${a.title} — ${a.owner} (due ${a.due})`).join("\n") || "—"}`,
  ].join("\n");
  await fetch(webhookUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: lines }),
  });
}

function safe(s: string) {
  return s.replace(/[^a-z0-9-_ ]/gi, "").trim().slice(0, 60) || "meeting";
}