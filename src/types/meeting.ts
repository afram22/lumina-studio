export type ActionItem = { title: string; owner: string; due: string; status: "confirmed" | "suggestion" };
export type Segment = { timestamp: string; speaker: string; text: string };
export type Milestone = { date: string; milestone: string };
export type Meeting = {
  id: string;
  title: string;
  status: string;
  error: string | null;
  summary: string | null;
  transcript: Segment[] | null;
  decisions: string[] | null;
  action_items: ActionItem[] | null;
  timeline: Milestone[] | null;
  scope_of_work: string | null;
  agent_log: string[] | null;
};