# SQL Migrationer — nembyggestyring.dk

Køres manuelt i Supabase Dashboard → SQL Editor.
Marker med dato når de er kørt i produktion.

---

## Kørt

### 2025 — Kontrakter tabel udvidet

```sql
-- Håndværker-token og godkendelsesflow
ALTER TABLE kontrakter
  ADD COLUMN IF NOT EXISTS haandvaerker_token text,
  ADD COLUMN IF NOT EXISTS haandvaerker_godkendt_at timestamptz,
  ADD COLUMN IF NOT EXISTS bygherre_godkendt_at timestamptz,
  ADD COLUMN IF NOT EXISTS haandvaerker_navn text,
  ADD COLUMN IF NOT EXISTS haandvaerker_firma text,
  ADD COLUMN IF NOT EXISTS haandvaerker_email text,
  ADD COLUMN IF NOT EXISTS haandvaerker_cvr text,
  ADD COLUMN IF NOT EXISTS tidsplan jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'udkast';
```

```sql
-- Tilbudsdokument upload + besigtigelse
ALTER TABLE kontrakter
  ADD COLUMN IF NOT EXISTS tilbud_dokument_url text,
  ADD COLUMN IF NOT EXISTS tilbud_dokument_sti text,
  ADD COLUMN IF NOT EXISTS tilbud_dokument_navn text,
  ADD COLUMN IF NOT EXISTS besigtigelse_dato date,
  ADD COLUMN IF NOT EXISTS besigtigelse_bekraeftet boolean DEFAULT false;
```

```sql
-- Forudsaetninger (krav fra haandvaerker til bygherre)
ALTER TABLE kontrakter
  ADD COLUMN IF NOT EXISTS forudsaetninger text,
  ADD COLUMN IF NOT EXISTS forudsaetninger_sendt_at timestamptz,
  ADD COLUMN IF NOT EXISTS forudsaetninger_godkendt boolean DEFAULT false;
```

```sql
-- Email-notifikationer toggle på profiler
ALTER TABLE profiler
  ADD COLUMN IF NOT EXISTS email_notifikationer boolean DEFAULT true;
```

---

## Ikke kørt endnu

*(ingen)*

---

## Supabase Storage buckets

- `tilbudsdokumenter` — Public bucket til tilbuds-PDF og Word-filer. Opret i Dashboard → Storage.
- `projektbilleder` — Public bucket til billeder på projekter og mangler.
