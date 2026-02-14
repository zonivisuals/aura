import { auth } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const response = await fetch(
    `http://localhost:8000/recommendations/${userId}`
  );
  const data = await response.json();
  return NextResponse.json(data);
}
