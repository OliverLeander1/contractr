"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ForsideHeader() {
  const [initialer, setInitialer] = useState<string | null>(null);
  const [dashUrl, setDashUrl] = useState("/dashboard");

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profil } = await supabase
        .from("profiler")
        .select("navn, rolle")
        .eq("id", user.id)
        .maybeSingle();
      if (profil?.navn) {
        const dele = profil.navn.trim().split(" ");
        setInitialer(dele.length >= 2 ? dele[0][0] + dele[dele.length - 1][0] : dele[0][0]);
      } else {
        setInitialer("?");
      }
      setDashUrl(profil?.rolle === "haandvaerker" ? "/haandvaerker/sager" : "/dashboard");
    };
    hent();
  }, []);

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      <Link href="/haandvaerkere" className="text-sm font-medium text-gray-500 hover:text-[#1e3a2a] transition-colors whitespace-nowrap hidden sm:block">
        Find entreprenør
      </Link>
      {initialer ? (
        <Link
          href={dashUrl}
          className="w-9 h-9 rounded-full bg-[#1e3a2a] text-white text-sm font-bold flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
          title="Min konto"
        >
          {initialer.toUpperCase()}
        </Link>
      ) : (
        <Link href="/login" className="text-sm font-semibold text-[#1e3a2a] border border-[#1e3a2a]/30 px-4 py-2 rounded-lg hover:bg-[#1e3a2a]/5 transition-colors whitespace-nowrap">
          Log ind
        </Link>
      )}
    </div>
  );
}
