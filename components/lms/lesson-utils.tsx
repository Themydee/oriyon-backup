"use client";
import React from "react";

// ─── Color Constants ──────────────────────────────────────────────────────────
export const TYPE_DOT: Record<string, string> = {
  "Online Theory": "#818cf8", "In-Person Integration": "#4ade80",
  "Digital Literacy": "#fbbf24", "Practical Training": "#e879f9",
  "SME Development": "#fb923c", "Financial Literacy": "#38bdf8",
  "Insurance Literacy": "#f472b6", "Written Exam": "#818cf8",
  "Practical Assessment": "#e879f9", "Digital Assessment": "#fbbf24",
  "SME Assessment": "#fb923c", "Results Publication": "#4ade80",
};

export function typeDot(type: string): string { return TYPE_DOT[type] ?? "#4ade80"; }

export function isVideoLesson(mod: { type: string }): boolean {
  const videoTypes = new Set([
    "Online Theory", "Digital Literacy", "Financial Literacy",
    "Insurance Literacy", "SME Development",
  ]);
  return videoTypes.has(mod.type);
}

export function isPhysicalLesson(mod: { type: string }): boolean {
  return new Set(["In-Person Integration", "Practical Training"]).has(mod.type);
}

export function getPlaceholderBody(type: string): string {
  const bodies: Record<string, string> = {
    "Online Theory": `Welcome to this online theory module.\n\nIn this lesson you will build a solid theoretical foundation for the topic ahead. Read each section carefully before moving on.\n\n📌 Key concepts\nThis module introduces the core principles that underpin everything you will practise in the field. Take your time to absorb each idea — your quiz questions will draw directly from this material.\n\n📌 Why this matters\nUnderstanding the theory behind goat husbandry allows you to make better decisions on the farm. Farmers who understand the "why" behind a practice are far better equipped to adapt when conditions change.\n\n📌 Your task\nAs you read, note down two things you found surprising or didn't know before. You'll be invited to share these during your next in-person session.\n\nScroll to the bottom of this lesson to mark it as complete.`,
    "In-Person Integration": `This module is delivered in-person at your Training Centre.\n\nUse this page to review the material before your session — being prepared will help you make the most of the facilitated time.\n\n📌 What to expect\nYour facilitator will guide the group through hands-on exercises that connect what you have read online to real-world application. Come ready to participate, ask questions, and share observations from your own farming context.\n\n📌 Before you attend\n• Review the related Online Theory lessons\n• Bring your RUMER login details\n• Bring any notes or questions from your self-study\n\n📌 After the session\nLog in to RUMER and update your progress records. Any field observations you made during the session should be entered under the relevant livestock record.\n\nScroll to the bottom to confirm you have read this briefing.`,
    "Digital Literacy": `Welcome to your Digital Literacy session.\n\nThis module will help you build confidence using the RUMER platform — the digital spine of the EEWYLA programme.\n\n📌 What you will practise\n• Navigating your RUMER dashboard\n• Entering and updating livestock records\n• Uploading field photos as evidence\n• Reviewing your own training progress\n\n📌 Why digital records matter\nAccurate digital records are the foundation of traceability — a critical requirement for accessing formal markets, insurance products, and finance. Every entry you make is building your digital farming identity.\n\nScroll to the bottom to mark this session briefing as read.`,
    "Practical Training": `This is a hands-on practical training session held at your Field / Farm Site.\n\n📌 Safety first\nBefore handling any animals, ensure you have reviewed the safe handling protocol covered in Week 1. Wear appropriate clothing and footwear.\n\n📌 What you will practise\nYour facilitator will demonstrate each technique before asking you to attempt it yourself. Observe carefully, ask questions freely, and take your time.\n\n📌 Recording your work\nAfter the practical session, log your activities in RUMER under the relevant week.\n\nScroll to the bottom to confirm you have read this practical briefing.`,
    "SME Development": `Welcome to your SME Development module.\n\n📌 What you will cover\nFrom business planning to cooperative models, this module gives you the tools to think about your goat enterprise not just as a farm, but as a business.\n\n📌 Key takeaway\nThe most successful small livestock farmers are the ones who keep records — not just of their animals, but of their money.\n\nScroll to the bottom to mark this briefing as read.`,
    "Financial Literacy": `Welcome to your Financial Literacy module.\n\n📌 What you will learn\n• How savings and credit cooperatives work\n• What lenders look for before approving a loan\n• How to read a basic financial statement\n• What collateral means and how your livestock can play a role\n\nScroll to the bottom to confirm you have read this module.`,
    "Insurance Literacy": `Welcome to your Insurance Literacy module.\n\n📌 Why insurance matters\nDisease outbreaks, extreme weather, and theft are all real risks for every farmer. Insurance is not a luxury — it is a risk management tool.\n\n📌 What you will cover\n• Types of livestock insurance products available in Nigeria\n• How premiums are calculated\n• The claims process — step by step\n\nScroll to the bottom to confirm you have read this module.`,
  };
  return bodies[type] ?? `Welcome to this lesson.\n\nRead through the material carefully. Scroll to the bottom to mark this lesson as complete.`;
}

export function getVideoUrl(mod: { type: string, videoUrl?: string }): string | null {
  if (mod.videoUrl) return mod.videoUrl;
  const placeholderVideos: Record<string, string> = {
    "Online Theory":      "https://www.youtube.com/embed/ysz5S6PUM-U",
    "Digital Literacy":   "https://www.youtube.com/embed/77ZozI0rw7w",
    "Financial Literacy": "https://www.youtube.com/embed/GcXY7bALbdY",
    "Insurance Literacy": "https://www.youtube.com/embed/tS5GHwnZHRw",
    "SME Development":    "https://www.youtube.com/embed/JoqWNGCwQxA",
  };
  return placeholderVideos[mod.type] ?? null;
}

type Block =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "paragraph"; text: string }
  | { type: "spacer" };

function parseLessonBody(text: string): Block[] {
  if (!text) return [];
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let currentList: string[] = [];
  let currentTableLines: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: "list", items: currentList });
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      const tableLines = currentTableLines.map(line =>
        line
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map(cell => cell.trim())
      );

      if (tableLines.length > 0) {
        const headers = tableLines[0];
        let rows = tableLines.slice(1);
        if (rows.length > 0 && rows[0].every(cell => /^[-:]+$/.test(cell))) {
          rows = rows.slice(1);
        }
        blocks.push({ type: "table", headers, rows });
      }
      currentTableLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      currentTableLines.push(line);
      continue;
    } else {
      flushTable();
    }

    if (line.startsWith("•")) {
      currentList.push(line.substring(1).trim());
      continue;
    } else {
      flushList();
    }

    if (line.startsWith("📌")) {
      blocks.push({ type: "heading", text: line.substring(1).trim() });
    } else if (line === "") {
      blocks.push({ type: "spacer" });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  flushList();
  flushTable();

  return blocks;
}

export function LessonBody({ bodyText, dot }: { bodyText: string; dot: string }) {
  const blocks = parseLessonBody(bodyText);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <div key={i} className="flex gap-2 items-start font-bold text-sm mt-6 mb-2" style={{ color: dot }}>
                <span className="flex-shrink-0 mt-0.5">📌</span>
                <span>{block.text}</span>
              </div>
            );
          case "list":
            return (
              <div key={i} className="flex flex-col gap-1.5 pl-2 mb-2">
                {block.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 text-white/55 text-sm">
                    <span className="flex-shrink-0" style={{ color: dot }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            );
          case "table":
            return (
              <div key={i} className="my-4 overflow-x-auto border border-white/[0.08] rounded-xl bg-white/[0.01]">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                      {block.headers.map((header, idx) => (
                        <th key={idx} className="px-4 py-3 font-bold text-white/80 text-xs uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.01] transition-colors">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-4 py-3 text-white/60">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "spacer":
            return <div key={i} className="h-3" />;
          case "paragraph":
            return <p key={i} className="text-white/45 text-sm leading-relaxed mb-2">{block.text}</p>;
          default:
            return null;
        }
      })}
    </div>
  );
}
