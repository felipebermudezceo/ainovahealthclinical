-- Actualiza el médico existente. No cambia correo, teléfono ni otras columnas.
-- No borra filas. Ejecutar en el SQL Editor de Supabase.

update public.doctors
set
  full_name = 'Emmanuel Lopez Vargas',
  specialty = 'Médico General',
  professional_license = 'RM: 6284048';
