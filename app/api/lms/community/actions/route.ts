import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, questionId, answerId, userId } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    switch (action) {
      case "answer":
        return NextResponse.json({ success: true, action: "answer", questionId, answerId });
      case "vote_question":
        return NextResponse.json({ success: true, action: "vote_question", questionId, userId });
      case "vote_answer":
        return NextResponse.json({ success: true, action: "vote_answer", questionId, answerId, userId });
      case "resolve":
        return NextResponse.json({ success: true, action: "resolve", questionId, answerId });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Action failed" }, { status: 500 });
  }
}
