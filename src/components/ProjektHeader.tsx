"use client";

import { useEffect, useState } from "react";

const projektTypeLabels: Record<string, { label: string; ikon: string }> = {
  badevarelse: { label: "Badeværelse", ikon: "🚿" },
  kokken: { label: "Køkken", ikon: "🍳" },
  tag: { label: "Tag", ikon: "🏠" },
  tilbygning: { label: "Tilbygning", ikon: "🏗️" },
  totalrenovering: { label: "Totalrenovering", ikon: "🔨" },
  vinduer: { label: "Vinduer & facade", ikon: "🪟" },
  maler: { label: "Maler & gips", ikon: "🖌️" },
  andet: { label: "Andet", ikon: "📋" },
};

export default function ProjektHeader() {
  const [projekttype, setProjekttype] = useState("");
  const [adresse, setAdresse] = useState("");
  const [oprettet] = useState(() => new Date().toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" }));

  useEffect(() => {
    setProjekttype(sessionStorage.getItem("screening_projekttype") || "");
    setAdresse(sessionStorage.getItem("screening_adresse") || "");
  }, []);

  const typeInfo = projektTypeLabels[projekttype] ?? { label: "Renovering", ikon: "🏠" };
  const titel = adresse ? `${typeInfo.label} - ${adresse.split(",")[0]}` : typeInfo.label;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="w-24 h-20 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex-shrink-0 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center text-3xl">{typeInfo.ikon}</div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{titel}</h1>
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">Ny sag</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1.5">
              {[
                { label: "Projekttype", value: typeInfo.label },
                { label: "Adresse", value: adresse || "Ikke angivet" },
                { label: "Oprettet", value: oprettet },
                { label: "Status", value: "Aftaletjek gennemført" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-medium text-gray-700">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
