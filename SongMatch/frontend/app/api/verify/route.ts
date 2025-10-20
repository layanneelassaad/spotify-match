import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Forwarding token to backend:", body);

    const res = await fetch("http://localhost:5050/api/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Next.js proxy",
      },
      body: JSON.stringify(body),
    });
    

    const text = await res.text();
    console.log("Response status from backend:", res.status);
    console.log("Response text:", text);

    if (!res.ok) {
      console.error("❌ Backend responded with error text:", text);
      return NextResponse.json({ error: text }, { status: res.status });
    }

    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    console.error("❌ API route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
