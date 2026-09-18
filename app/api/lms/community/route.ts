import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channel") || "all";
    const filter = searchParams.get("filter") || "all";
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "qna";

    return NextResponse.json({
      success: true,
      channelId,
      filter,
      search,
      type,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, question, chatMessage } = body;

    if (type === "chat" && chatMessage) {
      return NextResponse.json({
        success: true,
        type: "chat",
        message: chatMessage,
      });
    }

    if (type === "question" && question) {
      return NextResponse.json({
        success: true,
        type: "question",
        question,
      });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
