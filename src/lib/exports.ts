import type { Meeting } from "@/types/meeting";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";

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

export function downloadPdf(m: Meeting) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensure = (need: number) => {
    if (y + need > pageH - margin) { pdf.addPage(); y = margin; }
  };
  const writeBlock = (text: string, size = 11, bold = false, color: [number,number,number] = [30,30,40]) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text || "—", maxW);
    for (const line of lines) {
      ensure(size + 4);
      pdf.text(line, margin, y);
      y += size + 4;
    }
  };
  const heading = (label: string) => {
    y += 10; ensure(28);
    pdf.setFillColor(139, 92, 246);
    pdf.rect(margin, y - 8, 3, 14, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(20, 20, 30);
    pdf.text(label.toUpperCase(), margin + 10, y + 4);
    y += 18;
  };

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(15, 15, 25);
  const title = pdf.splitTextToSize(m.title, maxW);
  pdf.text(title, margin, y + 16);
  y += 16 + title.length * 22;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(120, 120, 130);
  pdf.text(`Generated ${new Date().toLocaleString()}`, margin, y);
  y += 16;

  heading("Summary");
  writeBlock(m.summary ?? "—");

  heading("Decisions");
  for (const d of m.decisions ?? []) writeBlock(`• ${d}`);
  if (!(m.decisions ?? []).length) writeBlock("—");

  heading("Action Items");
  for (const a of m.action_items ?? []) {
    writeBlock(a.title, 11, true);
    writeBlock(`${a.owner} · due ${a.due} · ${a.status}`, 10, false, [110,110,120]);
  }
  if (!(m.action_items ?? []).length) writeBlock("—");

  heading("Scope of Work");
  writeBlock(m.scope_of_work ?? "—");

  heading("Timeline");
  for (const t of m.timeline ?? []) writeBlock(`${t.date}  —  ${t.milestone}`);
  if (!(m.timeline ?? []).length) writeBlock("—");

  heading("Transcript");
  for (const seg of m.transcript ?? []) {
    writeBlock(`[${seg.timestamp}] ${seg.speaker}`, 10, true, [90,90,100]);
    writeBlock(seg.text, 11);
    y += 4;
  }

  pdf.save(`${safe(m.title)}.pdf`);
}

export async function sendEmailViaResend(m: Meeting, to: string) {
  const html = buildReportHtml(m);
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: {
      to,
      subject: `Meeting notes: ${m.title}`,
      html,
    },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

function buildReportHtml(m: Meeting): string {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const list = (xs: string[]) => xs.length ? `<ul>${xs.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "<p>—</p>";
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:auto;color:#111">
      <h1 style="font-size:22px;border-left:3px solid #8B5CF6;padding-left:10px">${esc(m.title)}</h1>
      <h2 style="font-size:14px;color:#555;text-transform:uppercase">Summary</h2>
      <p>${esc(m.summary ?? "—")}</p>
      <h2 style="font-size:14px;color:#555;text-transform:uppercase">Decisions</h2>
      ${list((m.decisions ?? []).map(String))}
      <h2 style="font-size:14px;color:#555;text-transform:uppercase">Action Items</h2>
      ${list((m.action_items ?? []).map(a => `${a.title} — ${a.owner} (due ${a.due}) [${a.status}]`))}
      <h2 style="font-size:14px;color:#555;text-transform:uppercase">Scope of Work</h2>
      <p>${esc(m.scope_of_work ?? "—")}</p>
      <h2 style="font-size:14px;color:#555;text-transform:uppercase">Timeline</h2>
      ${list((m.timeline ?? []).map(t => `${t.date} — ${t.milestone}`))}
    </div>`;
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