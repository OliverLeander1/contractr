import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://www.nembyggestyring.dk";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  let authedUser: { id: string; email?: string } | null = null;

  // Ny Supabase email-flow: token_hash + type (magic link og OTP)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error && data.user) {
      authedUser = data.user;
    }
  }

  // Ældre PKCE-flow: code exchange
  if (!authedUser && code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      authedUser = data.user;
    }
  }

  if (!authedUser) {
    return NextResponse.redirect(new URL("/login?fejl=bekraeftelse", baseUrl));
  }

  // Sikr at der findes en profil-række — opretter én hvis brugeren er ny
  // (bruges primært af håndværkere der logger ind via magic link)
  const db = createServiceClient();
  const { data: profil } = await db
    .from("profiler")
    .select("id")
    .eq("id", authedUser.id)
    .single();

  if (!profil) {
    await db.from("profiler").insert({
      id: authedUser.id,
      email: authedUser.email ?? null,
      rolle: "haandvaerker",
      email_notifikationer: true,
    });
  }

  return NextResponse.redirect(new URL(next, baseUrl));
}
