import { NextRequest, NextResponse } from "next/server";

export interface TrainerTicket {
  id: string;
  ticketCode: string; // e.g. TRN-2026-8912
  traineeName: string;
  traineeEmail: string;
  traineePhone: string;
  cohortOrLga: string;
  trainerName: string;
  incidentDate: string;
  category:
    | "Trainer Absenteeism"
    | "Unprofessional Conduct"
    | "Course Content / Explanation Issue"
    | "Assessment & Grading Concern"
    | "Facility / Practical Session Issue"
    | "Other Trainer Concern";
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  evidenceFilename?: string;
  evidenceMimeType?: string;
  status: "Open" | "In Review" | "Resolved" | "Escalated";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory persistent store for development & mock fallback
const ticketsStore: TrainerTicket[] = [
  {
    id: "ticket-101",
    ticketCode: "TRN-2026-4819",
    traineeName: "Adewale Temitope",
    traineeEmail: "adewale.t@example.com",
    traineePhone: "08031234567",
    cohortOrLga: "Oyo Central - Cohort A",
    trainerName: "Dr. K. Ogunleye",
    incidentDate: "2026-09-28",
    category: "Trainer Absenteeism",
    severity: "High",
    description: "The assigned trainer was absent for 2 consecutive practical goat handling sessions in Oyo Town without prior notice or substitute trainer.",
    status: "In Review",
    adminResponse: "Investigating with Oyo Central program coordinator. A replacement session has been scheduled.",
    createdAt: "2026-09-29T10:15:00Z",
    updatedAt: "2026-09-29T14:20:00Z",
  },
  {
    id: "ticket-102",
    ticketCode: "TRN-2026-9102",
    traineeName: "Bisi Akande",
    traineeEmail: "bisi.a@example.com",
    traineePhone: "08149876543",
    cohortOrLga: "Ibadan South - Cohort B",
    trainerName: "Mrs. F. Adebayo",
    incidentDate: "2026-09-25",
    category: "Course Content / Explanation Issue",
    severity: "Medium",
    description: "The trainer went through Week 4 nutrition calculation slides too fast and declined to answer questions during the Q&A segment.",
    status: "Resolved",
    adminResponse: "Spoken to trainer Mrs. Adebayo. Additional tutorial session allocated for Week 4 review on Friday.",
    createdAt: "2026-09-26T11:00:00Z",
    updatedAt: "2026-09-27T09:30:00Z",
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// POST /api/trainer-tickets — Submit new trainer issue
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      traineeName,
      traineeEmail,
      traineePhone,
      cohortOrLga,
      trainerName,
      incidentDate,
      category,
      severity,
      description,
      evidenceFilename,
      evidenceMimeType,
    } = body;

    if (!traineeName || !traineeEmail || !trainerName || !category || !description) {
      return NextResponse.json(
        { error: "Please fill in all mandatory fields (Name, Email, Trainer Name, Category, Description)." },
        { status: 400 }
      );
    }

    // Attempt forwarding to API Gateway backend first
    try {
      const response = await fetch(`${API_BASE}/trainer-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Gateway endpoint not active yet — fallback to internal ticket generator
    }

    // Generate unique Ticket Tracking Code
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketCode = `TRN-${new Date().getFullYear()}-${randomNum}`;

    const newTicket: TrainerTicket = {
      id: `ticket-${Date.now()}`,
      ticketCode,
      traineeName,
      traineeEmail,
      traineePhone: traineePhone || "",
      cohortOrLga: cohortOrLga || "Not Specified",
      trainerName,
      incidentDate: incidentDate || new Date().toISOString().split("T")[0],
      category,
      severity: severity || "Medium",
      description,
      evidenceFilename,
      evidenceMimeType,
      status: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ticketsStore.unshift(newTicket);

    return NextResponse.json({
      success: true,
      message: "Trainer issue ticket logged successfully.",
      ticketCode,
      ticket: newTicket,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process trainer issue ticket." },
      { status: 500 }
    );
  }
}

// GET /api/trainer-tickets — Fetch tickets or search by code/email
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code") || searchParams.get("ticketCode");
    const email = searchParams.get("email");

    // Attempt backend proxy first
    try {
      const queryStr = searchParams.toString();
      const response = await fetch(`${API_BASE}/trainer-tickets?${queryStr}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {}

    // In-memory fallback response
    let filtered = [...ticketsStore];

    if (code) {
      filtered = filtered.filter(
        (t) => t.ticketCode.toLowerCase().trim() === code.toLowerCase().trim()
      );
    } else if (email) {
      filtered = filtered.filter(
        (t) => t.traineeEmail.toLowerCase().trim() === email.toLowerCase().trim()
      );
    }

    return NextResponse.json({ tickets: filtered, count: filtered.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch tickets." },
      { status: 500 }
    );
  }
}

// PATCH /api/trainer-tickets — Update ticket status or resolution notes (Admin)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, ticketCode, status, adminResponse } = body;

    if (!ticketId && !ticketCode) {
      return NextResponse.json(
        { error: "ticketId or ticketCode is required." },
        { status: 400 }
      );
    }

    // Try backend proxy
    try {
      const response = await fetch(`${API_BASE}/trainer-tickets`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {}

    const index = ticketsStore.findIndex(
      (t) => t.id === ticketId || t.ticketCode === ticketCode
    );

    if (index === -1) {
      return NextResponse.json(
        { error: "Ticket not found." },
        { status: 404 }
      );
    }

    if (status) ticketsStore[index].status = status;
    if (adminResponse !== undefined) ticketsStore[index].adminResponse = adminResponse;
    ticketsStore[index].updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: "Ticket updated successfully.",
      ticket: ticketsStore[index],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update ticket." },
      { status: 500 }
    );
  }
}
