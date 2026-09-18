import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Forward the JSON body to the backend API Gateway complaints endpoint
    const response = await fetch(`${API_BASE}/complaints`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to submit complaint to backend." },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in complaints proxy route:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend server." },
      { status: 500 }
    );
  }
}
