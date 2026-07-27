import Link from "next/link";

const BackArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export default function SimpleNav({
  tilbage,
  tilbageLabel = "Tilbage",
  højre,
}: {
  tilbage?: string;
  tilbageLabel?: string;
  højre?: React.ReactNode;
}) {
  return (
    <nav className="bg-white border-b border-[#e0ddd6] px-6 py-4 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center">
        {/* Venstre — pil */}
        <div className="flex-1 flex items-center">
          {tilbage && (
            <Link
              href={tilbage}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <BackArrow />
              {tilbageLabel}
            </Link>
          )}
        </div>

        {/* Centrum — logo */}
        <Link href="/" className="logo flex-shrink-0">
          nembyggestyring
        </Link>

        {/* Højre — valgfri handling */}
        <div className="flex-1 flex justify-end">
          {højre}
        </div>
      </div>
    </nav>
  );
}
