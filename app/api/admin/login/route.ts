import { NextRequest, NextResponse } from "next/server";

const COOKIE_OPTS = {
  path: "/",
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({ password: "" }));

  if (!password || password !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  // httpOnly token — never readable by JS, checked server-side on every admin action
  res.cookies.set("admin_token", process.env.ADMIN_SECRET!, {
    ...COOKIE_OPTS,
    httpOnly: true,
  });

  // Readable session flag — lets the UI know admin is logged in without exposing the secret
  res.cookies.set("admin_session", "1", {
    ...COOKIE_OPTS,
    httpOnly: false,
  });

  return res;
}
