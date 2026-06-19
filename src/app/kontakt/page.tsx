"use client";

import Link from "next/link";


export default function Kontakt() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="" style={{fontFamily:"var(--font-logo)",fontWeight:200,letterSpacing:"2px"}}>Contractr</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Tilbage til forsiden</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Kontakt os</h1>
          <p className="text-gray-500">Vi svarer normalt inden for 1-2 arbejdsdage.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 mb-1">E-mail</h2>
            <p className="text-sm text-gray-500 mb-3">Til generelle spørgsmål og support</p>
            <a href="mailto:hej@contractr.dk" className="text-sm font-semibold text-primary hover:underline">hej@contractr.dk</a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a5c38" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 mb-1">Live chat</h2>
            <p className="text-sm text-gray-500 mb-3">Hurtigst svar — tilgængelig når du er logget ind</p>
            <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Log ind og åbn chat →</Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="font-bold text-gray-900 mb-6">Send os en besked</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Navn</label>
                <input
                  type="text"
                  placeholder="Dit fulde navn"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  placeholder="din@email.dk"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Emne</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-gray-700">
                <option>Vælg et emne</option>
                <option>Spørgsmål til min screening</option>
                <option>Teknisk problem</option>
                <option>Fakturering og betaling</option>
                <option>Rådgiver-samarbejde</option>
                <option>Andet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Besked</label>
              <textarea
                rows={5}
                placeholder="Beskriv dit spørgsmål eller problem..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Send besked
            </button>
            <p className="text-xs text-gray-400 text-center">Vi svarer inden for 1-2 arbejdsdage · Dine oplysninger behandles fortroligt</p>
          </form>
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-900 mb-1">Er du rådgiver og vil tilkobles platformen?</p>
          <p className="text-sm text-amber-700">Skriv til os på <a href="mailto:partner@contractr.dk" className="font-medium hover:underline">partner@contractr.dk</a> med en kort beskrivelse af din virksomhed.</p>
        </div>
      </div>
    </div>
  );
}
