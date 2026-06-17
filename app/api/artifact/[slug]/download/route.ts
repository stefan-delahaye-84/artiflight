import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("artifacts")
    .select("title, html, source")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (data.source) {
    return new NextResponse(data.source, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.tsx"`,
      },
    });
  }

  return new NextResponse(data.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.html"`,
    },
  });
}
