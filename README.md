# Ombaa

Voice-first social app — *Kom je ook?*

Zie [CLAUDE.md](./CLAUDE.md) voor product, design en tone of voice.

## Stack

- **Expo (SDK 56) + React Native** — iOS én Android vanuit één codebase
- **Expo Router** — file-based routing in `app/`
- **Supabase** — auth (SMS), database, storage, realtime
- **Expo AV** — opnemen en afspelen
- **TypeScript**

## Aan de slag

### 1. Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Supabase

1. Maak een nieuw project op [supabase.com](https://supabase.com).
2. Open **SQL editor** en plak de inhoud van [`supabase/schema.sql`](./supabase/schema.sql).
3. Zet **Auth → Phone provider** aan (Twilio of MessageBird).
4. Maak twee **Storage buckets**: `voices` en `fotos`, beide public-read.

### 3. .env

Kopieer `.env.example` naar `.env` en vul in:

```
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### 4. Starten

```bash
npm run start
```

Druk `i` voor iOS, `a` voor Android, of scan met de Expo Go app.

## Projectstructuur

```
app/                    # Expo Router schermen
  _layout.tsx           # root layout + fonts + auth gate
  onboarding/           # 6 onboarding-schermen
  (tabs)/               # 4 hoofd-tabs: Kom je ook? / Mijn oproepen / Berichten / Profiel
  plaats/               # activiteit plaatsen (mic → bevestigen → geplaatst)
  oproep/[id].tsx       # oproep + reacties
  chat/[id].tsx         # 1-op-1 gesprek
components/             # herbruikbare UI (Button, Text, VoiceBubble, Icon, Avatar...)
constants/theme.ts      # kleuren, fonts, spacing, radius
lib/                    # supabase client, auth context, stores
types/db.ts             # database types
supabase/schema.sql     # database + RLS policies
```

## Design

Alle design-tokens (kleuren, fonts, spacing) staan in [`constants/theme.ts`](./constants/theme.ts). Houd je aan CLAUDE.md voor tone of voice en taal.
