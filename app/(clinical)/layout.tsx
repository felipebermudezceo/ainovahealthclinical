import { AppHeader } from "@/components/app-header";
import { RequireSession } from "@/components/require-session";

export default function ClinicalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireSession>
      <div className="min-h-dvh">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
        >
          Saltar al contenido
        </a>
        <AppHeader />
        <main id="contenido" className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
          {children}
        </main>
      </div>
    </RequireSession>
  );
}
