# Projekt

- Nembyggestyring er en platform for private bygherrer og entreprenører.
- AB-Forbruger 2012 er det obligatoriske aftalemæssige fundament.
- Et komplet aftalegrundlag er først bindende, når begge parter har godkendt det.

# Låst arkitektur

- Ét projekt kan have 0, 1 eller flere uafhængige kontrakter.
- Hver kontrakt tilhører præcis ét projekt og én entreprenør.
- Samme entreprenør kan have flere kontrakter på samme projekt.
- Adgang må aldrig udledes af fag- eller entreprisetitel.
- Én privat chatsamtale pr. kontrakt.
- Legacy-samtaler med kontrakt_id = NULL må ikke gættes koblet til en kontrakt.

# Chatstatus

Fungerer nu:

- Bygherre kan åbne kontraktspecifik chat.
- Entreprenør kan åbne samme samtale med verificeret login.
- Begge parter kan sende og genindlæse beskeder.
- Bearer JWT og server-side kontraktautorisation bruges.
- Den gamle usikre chatroute er deaktiveret.
- Chat-navigation for bygherre forbliver aktiv på undersider.
- POST /api/chat/laest og GET /api/chat/oversigt er implementeret
  (commit 5481eb7). Ingen UI eller navigation bruger endnu disse
  endpoints — de er kun server-side på nuværende tidspunkt.
- Manuelt produktionstestet med autentificerede bygherre- og
  entreprenørkonti. Verificeret:
  - GET /api/chat/oversigt returnerer HTTP 200 for begge roller.
  - Kun autoriserede kontraktsamtaler returneres.
  - Links er rollebestemte (bygherre- hhv. entreprenørrute).
  - ulaest_samlet svarer til summen af samtalernes ulaest_antal.
  - En besked fra bygherren tæller som ulæst for entreprenøren, og
    entreprenørens svar tæller som ulæst for bygherren.
  - Brugerens egne beskeder tæller ikke som ulæste.
  - Læsestatus er individuel pr. bruger.
  - POST /api/chat/laest returnerer HTTP 200 og opdaterer læsestatus;
    preview, seneste afsender og seneste besked bevares efter læsning.
  - En ældre læsemarkering kan ikke flytte markøren baglæns.
  - Observerede 422-svar under testen skyldtes manuelt forkert
    kopierede besked-id'er i testscriptet, ikke en endpointfejl.
  - Legacy- og negativ adgangstest (fx forkert entreprenørs konto,
    kontrakt uden adgang) er ikke fuldt udført endnu.
  - Realtime og UI bruger endnu ikke endpointene.

Ikke implementeret endnu:

- global Chat
- seneste besked-preview på dashboards
- seneste afsender og tidspunkt på dashboards
- ulæst antal (UI)
- markering som læst (UI)
- global navigationsramme
- polling eller realtime
- email-, browser- eller pushnotifikationer

# Produktion

Kørt i produktion:

- supabase-migration-chat-kontrakt-id.sql
- den midlertidige RLS-migration fra commit 99685fd
- supabase-migration-chat-laesestatus.sql

public.chat_laesestatus findes nu med:

- samtale_id UUID
- bruger_id UUID → auth.users(id)
- senest_laeste_besked_id UUID
- sidst_laest_at TIMESTAMPTZ
- opdateret_at TIMESTAMPTZ
- primary key på samtale_id + bruger_id
- RLS enabled
- ingen policies
- service_role har SELECT, INSERT og UPDATE
- klientroller har ingen direkte tabeladgang

Migrationen blev kørt med:

Success. No rows returned

Migrationens commit:

ef0d1d2

# Relevante chatcommits

- 62ecaab — chat_samtaler.kontrakt_id
- b9c7e3b — sikker kontraktspecifik bygherrechat
- d028c42 — korrekt project owner ved oprettelse
- 98aad4f — rettelse af faktiske beskedkolonner
- 235dbde — aktiv Chat-navigation på undersider
- c050b6f — entreprenørens kontraktspecifikke chat
- ef0d1d2 — individuel chat-læsestatusstruktur

# Sikkerhedsregler

- Verificér Bearer JWT med auth.getUser().
- Bygherreadgang udledes server-side via projektets ejer.
- Entreprenøradgang udledes via verificeret login-email mod kontraktens haandvaerker_email.
- Token og localStorage må ikke bruges som autorisation.
- Klienten må ikke bestemme rolle, email, bruger-id eller projekt-id.
- Service role må først bruges efter eksplicit autorisation.
- public.notifikationer er ikke autoritativ chat-læsestatus.
- Ingen DELETE, TRUNCATE, DROP eller nulstilling.

# Parkeret

- nulstilling og sletning af testdata
- tidsplan og kalender
- endelig multi-kontraktmigration for betalinger, mangler og ekstraarbejde
- email-, push- og browsernotifikationer
- realtime-chat

# Beskyttede untracked filer

- .claude/settings.json
- .claude/skills/
- .mcp.json
- supabase-migration-chat.sql
- supabase-migration-kontrakter.sql
- supabase-migration-logbog.sql
- supabase-migration-rls-og-tabeller.sql
- supabase-migration-slet-konto.sql
- supabase-migration-nulstil-testdata.sql

Ingen af disse må stages, ændres, slettes eller køres.

# Kildehierarki

1. Verificeret produktion
2. Aktuel kode på main
3. Trackede, kørte migrationer
4. Dokumenterede beslutninger
5. Ældre lokale migrationsfiler
