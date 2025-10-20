import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing code from Spotify" },
      { status: 400 }
    );
  }

  try {
    const backendRes = await fetch("http://localhost:5050/api/spotify/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to exchange code" },
        { status: backendRes.status }
      );
    }

    // ✅ Create a response and set cookie
    const response = NextResponse.redirect("http://localhost:3000/dashboard");

    response.cookies.set("spotify_access_token", data.access_token, {
      httpOnly: false,
      maxAge: 3600,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Error exchanging Spotify code:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
