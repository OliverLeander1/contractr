@AGENTS.md

# ByggeTryg — projektinstruktioner til Claude

## Hvad er ByggeTryg?
Digital tryghedsplatform for private bygherrer. Brugeren uploader tilbud/kontrakt og får AI-drevet risikovurdering baseret på AB-Forbruger. Platformen samler aftale, tidsplan, betaling og dokumenter ét sted — og giver mulighed for at booke en uvildig byggerådgiver.

**Arbejdsnavn på domæne:** Pactly (pactly.dk — ikke registreret endnu)

## Ejer og kontekst
- Oliver Møller Leander, ansat i Safe-Con (byggerådgivning, Odense)
- Safe-Con bliver første rådgivervirksomhed på platformen
- Jacob (chef, stifter af Ajour EG og Finari) bakker op om ideen

## Tech-stack
- Next.js (App Router, TypeScript)
- Tailwind CSS + shadcn/ui (components.json)
- Kører lokalt på http://localhost:3000

## Nuværende sider i kodebasen
- `/` — forside
- `/opret` — opret projekt
- `/opret/upload` — upload dokument
- `/opret/screening` — AI-screening
- `/opret/rapport` — rapport
- `/projekt/[id]` — projektoverblik

## MVP — hvad platformen skal kunne
1. Opret projekt (navn, type, adresse, budget)
2. Vælg pakke: lille (499 kr.) / mellem (999 kr.) / stort (1.999 kr.)
3. Inviter entreprenør via email
4. Kontrakt-generator baseret på AB-Forbruger — digital underskrift
5. Tidsplan med milepæle
6. Betalingsoverblik koblet til milepæle
7. Dokumentdeling (upload tegninger, billeder, tilbud)
8. Mangel-registrering med foto → automatisk mangelbrev
9. Book rådgiver (tilkøb)

## Tilkøbsydelser og priser
| Ydelse | Pris |
|---|---|
| Er tilbuddet fair? (AI-gennemgang) | 995 kr. |
| Tal med en rådgiver (90 min. online, inkl. forberedelse) | 1.495 kr. |
| Hold øje med arbejdet (fysisk tilsyn + notat) | Fra 2.495 kr. |
| Håndværkeren vil ikke rette fejlene (rapport + mangelbrev) | Fra 1.995 kr. |
| Er arbejdet gjort ordentligt? (afleveringsgennemgang) | Fra 2.995 kr. |
| Skal jeg have tilladelse? (skriftlig afklaring) | 1.495 kr. |

## Brugertyper
- **Bygherre** — primær bruger, betaler for platformen
- **Håndværker/entreprenør** — inviteret via email, gratis adgang
- **Rådgiver (Safe-Con)** — intern bruger, ser bookinger og projektdokumenter

## Vigtige principper
- Platformen må aldrig give endelige juridiske konklusioner
- AB-Forbruger er altid referencerammen — henvis til den løbende
- Hold MVP smal — ingen chat mellem entreprenører, ingen bud-system endnu
- Priser på rådgiverydelser er faste (Model A) — ikke varierende per rådgiver

## Næste skridt
Design system rulles ud på alle sider. Derefter AI-screening med rigtig Claude API.

## Design system
- Baggrund: ren hvid `#ffffff`
- Primær: mørk grøn `#1a5c38`
- Accent: lys grøn `#f0f7f3`
- Tekst: `#111827`
- Sekundær tekst: `#6b7280`
- Border: `#e5e7eb`
- Font: system sans-serif, overskrifter bold 700
- Masser af whitespace, afrundede hjørner, ingen farveorgier
- Grøn er reserveret til handlingsknapper og aktive states

## Kodningsprincipper (Karpathy)
- **Tænk før kodning** — spørg ved uklarhed, lav ingen stumme antagelser
- **Enkelhed først** — minimal kode, ingen overingeniering
- **Kirurgiske ændringer** — rør kun hvad der er nødvendigt
- **Verificér** — tjek at ændringer virker før du rapporterer dem som færdige
