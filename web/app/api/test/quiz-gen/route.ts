import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const backendFormData = new FormData();
  backendFormData.append("file", file);

  try {
    const response = await fetch("http://localhost:8000/generate-quiz", {
      method: "POST",
      body: backendFormData,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Backend error" },
      { status: 500 }
    );
  }
}
