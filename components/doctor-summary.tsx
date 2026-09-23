"use client";

import { useEffect, useState } from "react";
import { ATTENDING_DOCTOR } from "@/lib/attending-doctor";
import { getCurrentDoctor, type DoctorProfile } from "@/lib/doctor";
import { displayValue } from "@/lib/format";

export function DoctorSummary() {
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentDoctor()
      .then((profile) => {
        if (active) setDoctor(profile);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const items = [
    { label: "Nombre", value: ATTENDING_DOCTOR.fullName },
    { label: "Especialidad", value: ATTENDING_DOCTOR.specialty },
    { label: "Cargo", value: ATTENDING_DOCTOR.role },
    { label: "Registro profesional", value: ATTENDING_DOCTOR.professionalLicense },
    { label: "Teléfono", value: doctor?.phone ?? "" },
    { label: "Correo", value: doctor?.email ?? "" },
  ];

  return (
    <section className="rounded-2xl border border-line bg-surface px-5 py-6 shadow-[0_1px_2px_rgba(18,38,58,0.04)] sm:px-7">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Médico responsable</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Médico único de AinovaHealth. El teléfono y el correo son los de la cuenta autenticada.
      </p>
      <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="bg-white px-4 py-3.5">
            <dt className="text-xs font-medium tracking-wide text-muted uppercase">{item.label}</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{displayValue(item.value)}</dd>
          </div>
        ))}
      </dl>
      {failed ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          No fue posible consultar el teléfono y el correo del médico.
        </p>
      ) : null}
      {doctor === null && !failed ? (
        <p className="mt-4 text-sm text-muted">Cargando teléfono y correo…</p>
      ) : null}
    </section>
  );
}
