"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { primaryButtonClass } from "@/components/button-styles";
import { registerDoctor } from "@/lib/register-doctor";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [fullName, setFullName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    let client;
    try {
      client = getSupabaseBrowserClient();
    } catch (caught) {
      if (active) {
        setError(caught instanceof Error ? caught.message : "No fue posible conectar con el servicio de acceso.");
        setReady(true);
      }
      return () => {
        active = false;
      };
    }

    client.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        if (data.user) {
          router.replace("/historias");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await registerDoctor({
        fullName,
        documentId,
        email,
        password,
        passwordConfirmation,
      });
      router.replace(result === "confirm_email" ? "/login?registro=confirmar" : "/login?registro=listo");
    } catch (caught) {
      setSubmitting(false);
      setError(caught instanceof Error ? caught.message : "No fue posible crear la cuenta.");
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark variant="login" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">Crear cuenta</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Registro de médico</p>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-2xl border border-line bg-surface px-5 py-7 shadow-[0_1px_2px_rgba(18,38,58,0.05)] sm:px-7"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-sm font-medium text-ink">
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="documentId" className="text-sm font-medium text-ink">
              Número de identificación
            </label>
            <input
              id="documentId"
              name="documentId"
              autoComplete="off"
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-xl border border-line bg-white px-3.5 pr-24 text-base outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-1.5 right-1.5 rounded-lg px-3 text-sm font-semibold text-muted hover:text-ink"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="passwordConfirmation" className="text-sm font-medium text-ink">
              Confirmación de contraseña
            </label>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </div>

          {error ? (
            <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className={`${primaryButtonClass} mt-6 w-full`}>
            {submitting ? "Creando cuenta…" : "Crear cuenta"}
          </button>

          <p className="mt-4 text-center text-sm text-muted">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="font-semibold text-accent">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
