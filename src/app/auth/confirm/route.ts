import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const rawNext = request.nextUrl.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const destination = request.nextUrl.clone(); destination.pathname = next; destination.search = "";
  let response = NextResponse.redirect(destination);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !tokenHash || !type) return NextResponse.redirect(new URL("/auth/error", request.url));
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll(values: { name:string; value:string; options:CookieOptions }[]) { values.forEach(({name,value,options}) => response.cookies.set(name,value,options)); } } });
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  return error ? NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, request.url)) : response;
}
