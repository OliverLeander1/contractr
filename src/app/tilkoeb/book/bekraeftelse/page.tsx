import Link from "next/link";

export default function BookingBekraeftelse() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking bekræftet!</h1>
          <p className="text-gray-500">Vi har modtaget din booking og sender en bekræftelse til din e-mail inden for 2 timer.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Din booking</h2>
          <div className="space-y-3">
            {[
              { label: "Ydelse", value: "Tal med en rådgiver" },
              { label: "Dato", value: "Onsdag d. 11. juni 2025" },
              { label: "Tidspunkt", value: "kl. 11:00 (90 min.)" },
              { label: "Projekt", value: "Indvendig renovering, Valby" },
              { label: "Pris betalt", value: "1.495 kr." },
            ].map((r) => (
              <div key={r.label} className="flex justify-between">
                <p className="text-sm text-gray-400">{r.label}</p>
                <p className="text-sm font-medium text-gray-900">{r.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Hvad sker der nu?</h2>
          <div className="space-y-4">
            {[
              { trin: "1", tekst: "Rådgiveren gennemgår dit projekt og dine dokumenter inden mødet" },
              { trin: "2", tekst: "Du modtager et videolink på e-mail dagen før" },
              { trin: "3", tekst: "Efter mødet sender rådgiveren en skriftlig rapport med anbefalinger" },
            ].map((t) => (
              <div key={t.trin} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">{t.trin}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{t.tekst}</p>
              </div>
            ))}
          </div>
        </div>

        <Link href="/projekt/1" className="block w-full bg-primary text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity text-center">
          Tilbage til projektet
        </Link>
      </div>
    </div>
  );
}
