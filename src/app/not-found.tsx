import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1e3a2a" strokeWidth="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <p className="text-6xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Siden findes ikke</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Den side du leder efter eksisterer ikke eller er blevet flyttet. Gå tilbage til forsiden og prøv igen.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Gå til forsiden
          </Link>
          <Link
            href="/kontakt"
            className="border border-gray-200 text-gray-600 font-medium px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Kontakt os
          </Link>
        </div>
      </div>
    </div>
  );
}
