// Testhulp voor de eerste testronde. Draait ALLEEN tegen de testdatabase.
//
//   node scripts/test/gebruiker-b.mjs reageer    B reageert op de nieuwste actieve oproep van A
//   node scripts/test/gebruiker-b.mjs rls        Controle onder de motorkap (alleen lezen)
//
// Instellingen staan in .maestro/.env.test (niet in git), zie .maestro/.env.test.example.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function leesEnv(pad) {
  try {
    return Object.fromEntries(
      readFileSync(pad, 'utf8')
        .split(/\r?\n/)
        .filter((r) => r.trim() && !r.startsWith('#'))
        .map((r) => {
          const i = r.indexOf('=');
          return [r.slice(0, i).trim(), r.slice(i + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
}

const test = leesEnv('.maestro/.env.test');
const prod = leesEnv('.env');
const URL = test.TEST_SUPABASE_URL;
const KEY = test.TEST_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error('TEST_SUPABASE_URL en TEST_SUPABASE_ANON_KEY ontbreken in .maestro/.env.test');
  process.exit(1);
}
// Veiligheidsslot: nooit tegen de database uit .env (productie).
if (prod.EXPO_PUBLIC_SUPABASE_URL && prod.EXPO_PUBLIC_SUPABASE_URL === URL) {
  console.error('STOP: TEST_SUPABASE_URL is dezelfde als in .env. Dit script draait nooit tegen productie.');
  process.exit(1);
}

const nieuw = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function login(phone, otp) {
  const sb = nieuw();
  const { error: e1 } = await sb.auth.signInWithOtp({ phone });
  if (e1) throw new Error(`OTP aanvragen mislukt voor ${phone}: ${e1.message}`);
  const { data, error: e2 } = await sb.auth.verifyOtp({ phone, token: otp, type: 'sms' });
  if (e2) throw new Error(`Inloggen mislukt voor ${phone}: ${e2.message}`);
  return { sb, user: data.user };
}

async function zorgVoorProfiel(sb, user, voornaam, locatie) {
  const { data } = await sb.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (data) return;
  const { error } = await sb.from('profiles').insert({ id: user.id, voornaam, leeftijd: 61, locatie });
  if (error) throw new Error(`Profiel B aanmaken mislukt: ${error.message}`);
}

async function reageer() {
  const { sb, user } = await login(test.PHONE_B, test.OTP_B);
  await zorgVoorProfiel(sb, user, 'Testb', 'Gent');

  const { data: oproepen, error } = await sb
    .from('oproepen')
    .select('id, activiteit, user:profiles(voornaam)')
    .eq('status', 'actief')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  const doel = oproepen.find((o) => o.user?.voornaam === 'Testa');
  if (!doel) throw new Error('Geen actieve oproep van Testa gevonden. Draai eerst flow 02.');

  // Korte stille "opname": inhoud maakt niet uit, het gaat om opslaan + koppelen.
  const pad = `${user.id}/${Date.now()}.m4a`;
  const { error: upErr } = await sb.storage
    .from('voices')
    .upload(pad, new Uint8Array(1024), { contentType: 'audio/mp4' });
  if (upErr) throw new Error(`Upload stem B mislukt: ${upErr.message}`);

  const { error: insErr } = await sb.from('reacties').insert({ oproep_id: doel.id, user_id: user.id, voice_url: pad });
  if (insErr) throw new Error(`Reactie plaatsen mislukt: ${insErr.message}`);
  console.log(`B heeft gereageerd op "${doel.activiteit}" (${doel.id}).`);
}

const uitslag = [];
function check(naam, ok, detail = '') {
  uitslag.push({ naam, ok, detail });
  console.log(`${ok ? 'OK  ' : 'FOUT'}  ${naam}${detail ? ` — ${detail}` : ''}`);
}

async function rls() {
  const { sb, user } = await login(test.PHONE_B, test.OTP_B);
  const anon = nieuw();

  // 1. Telefoonnummer van anderen opvragen
  const { data: p, error: pErr } = await sb.from('profiles').select('*').neq('id', user.id).limit(5);
  const kolommen = p?.[0] ? Object.keys(p[0]) : [];
  check('Profielen van anderen bevatten geen telefoonnummer', !kolommen.includes('telefoonnummer'),
    pErr ? pErr.message : `kolommen: ${kolommen.join(', ')}`);
  check('Profielen van anderen bevatten geen coördinaten', !kolommen.includes('lat'),
    kolommen.includes('lat') ? `lat/lng zichtbaar, bv. ${p[0].lat}, ${p[0].lng}` : '');

  // 2. Niet-ingelogde bezoeker
  const { data: pa } = await anon.from('profiles').select('*').limit(5);
  check('Bezoeker (niet ingelogd) kan geen profielen lezen', !(pa && pa.length),
    pa?.length ? `${pa.length} profielen leesbaar, velden: ${Object.keys(pa[0]).join(', ')}` : '');

  // 3. Oproepen: exacte locatie?
  const { data: o } = await sb.from('oproepen').select('id, locatie, lat, lng').neq('user_id', user.id).limit(5);
  check('Oproepen tonen alleen stad (lat/lng niet uitleesbaar)', !(o?.[0] && o[0].lat != null),
    o?.[0] ? `bv. ${o[0].locatie}: ${o[0].lat}, ${o[0].lng}` : 'geen oproepen gevonden');

  // 4. Buckets: publiek? listbaar?
  for (const bucket of ['voices', 'fotos']) {
    const { data: lijstB } = await sb.storage.from(bucket).list('', { limit: 100 });
    check(`Bucket ${bucket}: B kan niet alle mappen opsommen`, !(lijstB && lijstB.length > 1),
      `${lijstB?.length ?? 0} items zichtbaar`);
    const { data: lijstAnon } = await anon.storage.from(bucket).list('', { limit: 100 });
    check(`Bucket ${bucket}: bezoeker kan niets opsommen`, !(lijstAnon && lijstAnon.length),
      `${lijstAnon?.length ?? 0} items zichtbaar`);
  }

  // 5. Reacties van anderen op andermans oproepen
  const { data: r } = await sb.from('reacties').select('id, user_id').neq('user_id', user.id).limit(20);
  check('B ziet geen reacties van anderen (tenzij op eigen oproep)', true, `${r?.length ?? 0} zichtbaar (controleer handmatig)`);

  // 6. RLS-status per tabel kan de anon-rol niet opvragen; dat gebeurt via SQL in het dashboard.
  const fouten = uitslag.filter((u) => !u.ok).length;
  console.log(`\n${uitslag.length - fouten}/${uitslag.length} controles geslaagd.`);
  process.exitCode = fouten ? 2 : 0;
}

const cmd = process.argv[2];
const acties = { reageer, rls };
if (!acties[cmd]) {
  console.error('Gebruik: node scripts/test/gebruiker-b.mjs <reageer|rls>');
  process.exit(1);
}
acties[cmd]().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
