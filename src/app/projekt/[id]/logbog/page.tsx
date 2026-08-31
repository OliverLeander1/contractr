"use client";

import { use, useEffect, useState, useRef } from "react";
import ProjektNav from "@/components/ProjektNav";
import DeadlineTæller from "@/components/DeadlineTæller";
import { createClient } from "@/lib/supabase";
import { hentOprindeligAftaltSlutdato, hentOprindeligAftaltStartdato } from "@/lib/kontraktSlutdato";
import { erKontraktEndeligtIndgaaet } from "@/lib/kontraktGodkendelse";

interface LogEntry {
  id: string;
  forfatter_navn: string;
  tekst: string;
  billede_url: string | null;
  oprettet_at: string;
  forfatter_id: string;
}

const fmtTid = (iso: string) =>
  new Date(iso).toLocaleString("da-DK", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export default function Logbog({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [entries, setEntries]       = useState<LogEntry[]>([]);
  const [indlæser, setIndlæser]     = useState(true);
  const [tekst, setTekst]           = useState("");
  const [sender, setSender]         = useState(false);
  const [fejl, setFejl]             = useState("");
  const [slutdato, setSlutdato]     = useState<string | null>(null);
  const [startdato, setStartdato]   = useState<string | null>(null);
  const [brugerNavn, setBrugerNavn] = useState("");
  const [brugerId, setBrugerId]     = useState("");
  const [uploaderBillede, setUploaderBillede] = useState(false);
  const [billedeUrl, setBilledeUrl] = useState<string | null>(null);
  const [billedeNavn, setBilledeNavn] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hent = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIndlæser(false); return; }

      setBrugerId(user.id);

      const [{ data: profil }, { data: kontrakt }, { data: logs }] = await Promise.all([
        supabase.from("profiler").select("navn").eq("id", user.id).single(),
        supabase.from("kontrakter").select("startdato, slutdato, tidsplan, status, bygherre_godkendt_at, haandvaerker_godkendt_at").eq("projekt_id", id).order("oprettet_at", { ascending: false }).limit(1).single(),
        fetch(`/api/logbog?projekt_id=${id}`).then(r => r.json()),
      ]);

      // Deadline-tælleren må kun vise en dato, når kontrakten reelt er
      // endeligt indgået — fælles, autoritativ predicate (se
      // kontraktGodkendelse.ts).
      const erEndeligtIndgaaet = erKontraktEndeligtIndgaaet(kontrakt);

      setBrugerNavn(profil?.navn || user.email?.split("@")[0] || "Bygherre");
      setStartdato(erEndeligtIndgaaet ? hentOprindeligAftaltStartdato(kontrakt) : null);
      setSlutdato(erEndeligtIndgaaet ? hentOprindeligAftaltSlutdato(kontrakt) : null);
      setEntries(Array.isArray(logs) ? logs : []);
      setIndlæser(false);
    };
    hent();
  }, [id]);

  async function uploadBillede(file: File) {
    setUploaderBillede(true);
    const supabase = createClient();
    const sti = `logbog/${id}/${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const { error } = await supabase.storage.from("projektbilleder").upload(sti, file);
    if (error) { setFejl("Billedet kunne ikke uploades"); setUploaderBillede(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("projektbilleder").getPublicUrl(sti);
    setBilledeUrl(publicUrl);
    setBilledeNavn(file.name);
    setUploaderBillede(false);
  }

  async function sendEntry() {
    if (!tekst.trim()) return;
    setSender(true);
    setFejl("");

    const supabase = createClient();
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const res = await fetch("/api/logbog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        projekt_id: id,
        tekst,
        billede_url: billedeUrl,
        forfatter_navn: brugerNavn,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setEntries(prev => [data, ...prev]);
      setTekst("");
      setBilledeUrl(null);
      setBilledeNavn("");
    } else {
      setFejl(data.error || "Kunne ikke gemme notat");
    }
    setSender(false);
  }

  async function sletEntry(entryId: string) {
    const supabase = createClient();
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    await fetch(`/api/logbog?id=${entryId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setEntries(prev => prev.filter(e => e.id !== entryId));
  }

  if (indlæser) return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[#1e3a2a] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Logbog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dokumentér projektets forløb med noter og billeder. Bruges som dokumentation ved aflevering og eventuelle tvister.
          </p>
        </div>

        {/* Deadline-tæller */}
        {slutdato && (
          <div className="mb-6">
            <DeadlineTæller startdato={startdato} slutdato={slutdato} />
          </div>
        )}

        {/* Nyt notat */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">Tilføj notat</p>
          <textarea
            rows={3}
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            placeholder="Beskriv status, observationer eller aftaler fra i dag..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none transition-all"
          />

          {/* Billede */}
          <div className="mt-3">
            {billedeUrl ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="flex-1 truncate text-xs">{billedeNavn}</span>
                <button onClick={() => { setBilledeUrl(null); setBilledeNavn(""); }} className="text-gray-400 hover:text-red-500">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploaderBillede}
                className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-[#1e3a2a] transition-colors"
              >
                {uploaderBillede ? (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                )}
                {uploaderBillede ? "Uploader..." : "Tilføj billede"}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { if (e.target.files?.[0]) uploadBillede(e.target.files[0]); }}
            />
          </div>

          {fejl && <p className="mt-2 text-xs text-red-600">{fejl}</p>}

          <div className="mt-4 flex justify-end">
            <button
              onClick={sendEntry}
              disabled={sender || !tekst.trim()}
              className="bg-[#1e3a2a] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {sender ? "Gemmer..." : "Gem notat"}
            </button>
          </div>
        </div>

        {/* Tidslinje */}
        {entries.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-white">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">Ingen notater endnu</p>
            <p className="text-xs text-gray-400 mt-1">Brug logbogen til at dokumentere projektets forløb løbende.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {entry.billede_url && (
                  <a href={entry.billede_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={entry.billede_url}
                      alt="Logbog billede"
                      className="w-full max-h-64 object-cover"
                    />
                  </a>
                )}
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1e3a2a]/10 flex items-center justify-center text-[#1e3a2a] font-bold text-xs flex-shrink-0">
                        {entry.forfatter_navn.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{entry.forfatter_navn}</p>
                        <p className="text-[10px] text-gray-400">{fmtTid(entry.oprettet_at)}</p>
                      </div>
                    </div>
                    {entry.forfatter_id === brugerId && (
                      <button
                        onClick={() => sletEntry(entry.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{entry.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
