"use client";

import { use, useEffect, useState, useCallback } from "react";
import ProjektNav from "@/components/ProjektNav";
import ABTip from "@/components/ABTip";
import { createClient } from "@/lib/supabase";

interface Mangel {
  id: string;
  projekt_id: string;
  oprettet_af: string;
  beskrivelse: string;
  alvorlighed: "lav" | "middel" | "høj" | "kritisk";
  status: "åben" | "under-behandling" | "løst" | "tvist";
  billede_urls: string[] | null;
  deadline: string | null;
  oprettet_at: string;
}

const fmtDato = (iso: string) =>
  new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });

export default function Mangler({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [userId, setUserId]       = useState<string | null>(null);
  const [mangler, setMangler]     = useState<Mangel[]>([]);
  const [indlæser, setIndlæser]   = useState(true);
  const [vis, setVis]             = useState(false);
  const [gemmer, setGemmer]       = useState(false);

  const [beskrivelse, setBeskrivelse] = useState("");
  const [alvorlighed, setAlvorlighed] = useState<Mangel["alvorlighed"]>("middel");
  const [billedeFil, setBilledeFil]   = useState<File | null>(null);
  const [billedePreview, setBilledePreview] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const hentMangler = useCallback(async () => {
    setIndlæser(true);
    const { data } = await supabase
      .from("mangler")
      .select("*")
      .eq("projekt_id", id)
      .order("oprettet_at", { ascending: false });
    setMangler(data || []);
    setIndlæser(false);
  }, [id]);

  useEffect(() => { hentMangler(); }, [hentMangler]);

  async function tilfoej() {
    if (!beskrivelse.trim() || !userId || gemmer) return;
    setGemmer(true);

    let billedeUrls: string[] = [];

    if (billedeFil) {
      const filnavn = `${id}/${Date.now()}_${billedeFil.name}`;
      const { data: uploadData } = await supabase.storage
        .from("billeder")
        .upload(filnavn, billedeFil, { upsert: false });

      if (uploadData) {
        const { data: urlData } = supabase.storage.from("billeder").getPublicUrl(filnavn);
        if (urlData) billedeUrls = [urlData.publicUrl];
      }
    }

    await supabase.from("mangler").insert({
      projekt_id: id,
      oprettet_af: userId,
      beskrivelse: beskrivelse.trim(),
      alvorlighed,
      status: "åben",
      billede_urls: billedeUrls.length > 0 ? billedeUrls : null,
    });

    setBeskrivelse("");
    setAlvorlighed("middel");
    setBilledeFil(null);
    setBilledePreview(null);
    setVis(false);
    setGemmer(false);
    hentMangler();
  }

  async function skiftStatus(mangel_id: string, status: Mangel["status"]) {
    await supabase.from("mangler").update({ status }).eq("id", mangel_id);
    setMangler((prev) => prev.map((m) => m.id === mangel_id ? { ...m, status } : m));
  }

  const åbne           = mangler.filter(m => m.status === "åben").length;
  const underBehandling = mangler.filter(m => m.status === "under-behandling").length;

  const alvorlighedKlasse = (a: Mangel["alvorlighed"]) => ({
    kritisk: "bg-red-100 text-red-800",
    høj:     "bg-red-50 text-red-700",
    middel:  "bg-amber-100 text-amber-700",
    lav:     "bg-green-100 text-green-700",
  }[a]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mangler</h1>
            <p className="text-sm text-gray-400 mt-1">
              {åbne} åbne · {underBehandling} under behandling
            </p>
          </div>
          <button
            onClick={() => setVis(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1e3a2a] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Registrer mangel
          </button>
        </div>

        {/* Modal */}
        {vis && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="font-bold text-gray-900 mb-5">Ny mangel</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskrivelse</label>
                  <textarea
                    rows={3}
                    value={beskrivelse}
                    onChange={e => setBeskrivelse(e.target.value)}
                    placeholder="Beskriv manglen præcist: hvad, hvor og hvornår det blev opdaget..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a2a] focus:ring-2 focus:ring-[#1e3a2a]/10 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Alvorlighed</label>
                  <div className="flex gap-2">
                    {([
                      { id: "lav",    label: "Lav",    sel: "border-green-300 bg-green-50 text-green-700" },
                      { id: "middel", label: "Middel", sel: "border-amber-300 bg-amber-50 text-amber-700" },
                      { id: "høj",    label: "Høj",    sel: "border-red-300 bg-red-50 text-red-700" },
                      { id: "kritisk",label: "Kritisk",sel: "border-red-500 bg-red-100 text-red-800" },
                    ] as const).map(a => (
                      <button key={a.id} onClick={() => setAlvorlighed(a.id)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${alvorlighed === a.id ? a.sel : "border-gray-100 text-gray-500"}`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Billede <span className="text-gray-400 font-normal">(valgfrit)</span></label>
                  <label className="flex items-center gap-3 border border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-[#1e3a2a] transition-colors">
                    {billedePreview ? (
                      <img src={billedePreview} alt="Mangel" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                    )}
                    <span className="text-sm text-gray-500">{billedePreview ? "Skift billede" : "Upload billede af manglen"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const fil = e.target.files?.[0];
                      if (!fil) return;
                      setBilledeFil(fil);
                      const reader = new FileReader();
                      reader.onload = () => setBilledePreview(reader.result as string);
                      reader.readAsDataURL(fil);
                    }} />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setVis(false); setBeskrivelse(""); setBilledeFil(null); setBilledePreview(null); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Annuller
                </button>
                <button onClick={tilfoej} disabled={!beskrivelse.trim() || gemmer}
                  className="flex-1 py-3 rounded-xl bg-[#1e3a2a] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                  {gemmer ? "Gemmer..." : "Gem mangel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {indlæser ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a2a] rounded-full animate-spin" />
          </div>
        ) : mangler.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="font-semibold text-gray-900 mb-1">Ingen registrerede mangler</p>
            <p className="text-sm text-gray-400">Brug knappen ovenfor til at registrere mangler, når du opdager dem.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {mangler.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  {m.billede_urls?.[0] && (
                    <img src={m.billede_urls[0]} alt="Mangel" className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${alvorlighedKlasse(m.alvorlighed)}`}>
                        {m.alvorlighed}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        m.status === "løst"             ? "bg-gray-100 text-gray-500" :
                        m.status === "under-behandling" ? "bg-blue-100 text-blue-700" :
                        m.status === "tvist"            ? "bg-red-100 text-red-700" :
                                                          "bg-red-50 text-red-600"
                      }`}>
                        {m.status === "åben" ? "Åben" :
                         m.status === "under-behandling" ? "Under behandling" :
                         m.status === "løst" ? "Løst" : "Tvist"}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">{fmtDato(m.oprettet_at)}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{m.beskrivelse}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50 flex-wrap">
                  {m.status === "åben" && (
                    <button onClick={() => skiftStatus(m.id, "under-behandling")}
                      className="text-xs font-semibold text-blue-600 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                      Under behandling
                    </button>
                  )}
                  {m.status !== "løst" && (
                    <button onClick={() => skiftStatus(m.id, "løst")}
                      className="text-xs font-semibold text-green-600 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                      Marker som løst
                    </button>
                  )}
                  {m.status === "løst" && (
                    <button onClick={() => skiftStatus(m.id, "åben")}
                      className="text-xs font-semibold text-gray-500 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                      Genåben
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <ABTip type="info" paragraf="AB-Forbruger § 43" titel="Din ret til at tilbageholde betaling ved mangler"
          resumé="Ved dokumenterede mangler kan du tilbageholde et beløb svarende til manglernes udbedring. Tag altid billeder og noter dato."
          detaljer="Jf. AB-Forbruger § 43 har entreprenøren pligt og ret til at afhjælpe mangler inden rimelig tid. Du har 5 års reklamationsret fra afleveringsdatoen." />
      </div>
    </div>
  );
}
