"use client";

import { use, useState, useEffect } from "react";
import ProjektNav from "@/components/ProjektNav";

export default function InviterEntreprenoer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [emails, setEmails] = useState([""]);
  const [sendt, setSendt] = useState(false);
  const [kopieret, setKopieret] = useState<string | null>(null);
  const [projektNavn, setProjektNavn] = useState("Mit projekt");
  const [bygherreNavn, setBygherreNavn] = useState("Bygherre");

  useEffect(() => {
    const gemt = localStorage.getItem("contractr_projekt");
    if (gemt) {
      try {
        const d = JSON.parse(gemt);
        if (d.adresse) setProjektNavn(d.adresse);
        if (d.navn) setBygherreNavn(d.navn);
      } catch { /* ignore */ }
    }
  }, []);

  const tilfoejEmail = () => setEmails([...emails, ""]);
  const opdaterEmail = (i: number, val: string) => {
    const ny = [...emails];
    ny[i] = val;
    setEmails(ny);
  };

  const genererInvitationsLink = (email: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://contractr.dk";
    const params = new URLSearchParams({
      projekt: id,
      projektNavn,
      bygherre: bygherreNavn,
      email,
    });
    return `${base}/haandvaerker/opret-konto?${params.toString()}`;
  };

  const kopierLink = (email: string) => {
    navigator.clipboard.writeText(genererInvitationsLink(email));
    setKopieret(email);
    setTimeout(() => setKopieret(null), 2000);
  };

  if (sendt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjektNav id={id} />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Invitationer klar!</h1>
          <p className="text-gray-500 mb-8">Kopiér linkene nedenfor og send dem direkte til håndværkerne via e-mail eller SMS. Gratis for dem at oprette konto.</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left space-y-4 mb-8">
            {emails.filter(e => e).map((e) => (
              <div key={e}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-800">{e}</p>
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">Afventer svar</span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    readOnly
                    value={genererInvitationsLink(e)}
                    className="flex-1 text-xs border border-gray-100 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 truncate"
                  />
                  <button
                    onClick={() => kopierLink(e)}
                    className="flex-shrink-0 text-xs font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
                  >
                    {kopieret === e ? "Kopieret ✓" : "Kopiér"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <a href={`/projekt/${id}`} className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity inline-block">
            Gå til projektoverblik
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjektNav id={id} />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Inviter håndværkere</h1>
          <p className="text-sm text-gray-400 mt-1">De modtager et link til at oprette en gratis håndværkerkonto og tilknytte sig projektet</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">E-mailadresser</h2>
          <p className="text-sm text-gray-400 mb-5">Tilføj én eller flere håndværkere/entreprenører</p>
          <div className="space-y-3">
            {emails.map((e, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="email"
                  placeholder={`Håndværker ${i + 1} — f.eks. thomas@tmbyg.dk`}
                  value={e}
                  onChange={(ev) => opdaterEmail(i, ev.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                {emails.length > 1 && (
                  <button onClick={() => setEmails(emails.filter((_, j) => j !== i))} className="w-10 h-12 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={tilfoejEmail} className="mt-3 flex items-center gap-2 text-sm text-primary font-medium hover:underline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tilføj endnu en håndværker
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Hvad får håndværkeren adgang til?</h2>
          <div className="space-y-2">
            {["Se og underskrive kontrakten digitalt", "Se tidsplanen og markere milepæle som færdige", "Uploade billeder og dokumenter", "Se betalingsplanen og kommunikere via chat"].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                <p className="text-sm text-gray-600">{f}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => emails.some(e => e) && setSendt(true)}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity"
        >
          Generér invitationslinks
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">Du kan også springe dette over og invitere senere fra projektoverblikket</p>
      </div>
    </div>
  );
}
