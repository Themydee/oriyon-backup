import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds timeout for large video uploads

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const originalName = file.name || "video.mp4";
    const ext = path.extname(originalName) || ".mp4";
    const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `tut_${Date.now()}_${safeBase}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "tutorials");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/tutorials/${fileName}`;
    return NextResponse.json({ url: publicUrl, fileName }, { status: 201 });
  } catch (error: any) {
    console.error("Video upload server error:", error);
    return NextResponse.json({ error: "Failed to save video file to server" }, { status: 500 });
  }
}
