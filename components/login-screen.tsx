"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { primaryButtonClass } from "@/components/button-styles";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    getSupabaseBrowserClient()
      .auth.getUser()
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

    if (!email.trim() || !password) {
      setError("Ingrese el correo electrónico y la contraseña.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setSubmitting(false);
      const technical = [signInError.message, signInError.code].filter(Boolean).join(" · ");
      setError(
        process.env.NODE_ENV === "development"
          ? technical || "No fue posible iniciar sesión."
          : signInError.code === "email_not_confirmed"
            ? "Confirme el correo electrónico antes de iniciar sesión."
            : "Correo o contraseña incorrectos.",
      );
      return;
    }

    router.replace("/historias");
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
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">AinovaHealth Medical</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Gestión de historias clínicas</p>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-2xl border border-line bg-surface px-5 py-7 shadow-[0_1px_2px_rgba(18,38,58,0.05)] sm:px-7"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
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
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-xl border border-line bg-white px-3.5 pr-24 text-base outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-controls="password"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-1.5 right-1.5 rounded-lg px-3 text-sm font-semibold text-muted hover:text-ink"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-danger/20 bg-danger-bg px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={`${primaryButtonClass} mt-6 w-full`}
          >
            {submitting ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
