import { createClientForServer } from "@/lib/supabaseUtils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed&details=no_code_found`);
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=oauth_failed&details=${encodeURIComponent(error.message)}`
    );
  }

  // success → go to protected route
  return NextResponse.redirect(`${origin}/`);
}
