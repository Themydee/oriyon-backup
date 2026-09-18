import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "tutorials.json");

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const dir = path.dirname(DATA_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify([]), "utf-8");
  }
}

async function readTutorials() {
  await ensureDataFile();
  const content = await fs.readFile(DATA_FILE, "utf-8");
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeTutorials(tutorials: any[]) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(tutorials, null, 2), "utf-8");
}

export async function GET() {
  try {
    const tutorials = await readTutorials();
    return NextResponse.json(tutorials);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to read tutorials" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.videoUrl) {
      return NextResponse.json({ error: "Title and videoUrl are required" }, { status: 400 });
    }

    const tutorials = await readTutorials();
    const newTutorial = {
      id: body.id || `tut-${Date.now()}`,
      title: body.title,
      description: body.description || "",
      category: body.category || "Getting Started",
      videoUrl: body.videoUrl,
      duration: body.duration || "3 min",
      targetAudience: body.targetAudience || "All",
      notes: body.notes || [],
      createdAt: body.createdAt || new Date().toISOString(),
      isFeatured: Boolean(body.isFeatured),
    };

    const updated = [newTutorial, ...tutorials];
    await writeTutorials(updated);
    return NextResponse.json(newTutorial, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create tutorial" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Tutorial ID is required" }, { status: 400 });
    }

    const tutorials = await readTutorials();
    const index = tutorials.findIndex((t: any) => t.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }

    tutorials[index] = {
      ...tutorials[index],
      ...body,
    };

    await writeTutorials(tutorials);
    return NextResponse.json(tutorials[index]);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update tutorial" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Tutorial ID param is required" }, { status: 400 });
    }

    const tutorials = await readTutorials();
    const filtered = tutorials.filter((t: any) => t.id !== id);
    await writeTutorials(filtered);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete tutorial" }, { status: 500 });
  }
}
