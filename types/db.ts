export type Profile = {
  id: string;
  voornaam: string;
  leeftijd: number;
  locatie: string;
  telefoonnummer: string;
  avatar_url: string | null;
  interesses: string[];
  stem_url: string | null;
  no_show_count: number;
  created_at: string;
};

export type Oproep = {
  id: string;
  user_id: string;
  voice_url: string;
  activiteit: string;
  datum: string | null;
  locatie: string;
  foto_urls: string[];
  status: 'actief' | 'vervuld' | 'verlopen';
  gekozen_reactie_id: string | null;
  created_at: string;
  user?: Profile;
};

export type Reactie = {
  id: string;
  oproep_id: string;
  user_id: string;
  voice_url: string;
  status: 'wachtend' | 'gekozen' | 'niet_gekozen';
  created_at: string;
  user?: Profile;
};

export type Bericht = {
  id: string;
  chat_id: string;
  user_id: string;
  tekst: string | null;
  voice_url: string | null;
  created_at: string;
};

export type Chat = {
  id: string;
  oproep_id: string;
  user_a_id: string;
  user_b_id: string;
  laatste_bericht_at: string;
  created_at: string;
};
