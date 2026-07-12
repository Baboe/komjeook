import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

export type Bucket = 'voices' | 'fotos';

// Upload een lokaal bestand en geef het opslagpad terug (geen publieke URL:
// de buckets zijn privé, afspelen/tonen gaat via signed URLs).
export async function uploadBestand(bucket: Bucket, path: string, uri: string, contentType: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const { error } = await supabase.storage.from(bucket).upload(path, bytes.buffer, { contentType });
  if (error) throw error;
  return path;
}

const cache = new Map<string, { url: string; geldigTot: number }>();

// Zet een opslagpad om in een tijdelijke afspeelbare URL. Lokale bestanden
// en oude volledige URLs (data van vóór de privé-buckets) blijven werken.
export async function signedUrl(bucket: Bucket, pathOrUri: string): Promise<string> {
  if (/^(https?|file):/.test(pathOrUri)) return pathOrUri;
  const key = `${bucket}:${pathOrUri}`;
  const hit = cache.get(key);
  if (hit && hit.geldigTot > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(pathOrUri, 3600);
  if (error || !data) throw error ?? new Error('signed url mislukt');
  cache.set(key, { url: data.signedUrl, geldigTot: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
}

export function useSignedUrl(bucket: Bucket, pathOrUri: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(
    pathOrUri && /^(https?|file):/.test(pathOrUri) ? pathOrUri : null,
  );
  useEffect(() => {
    let actief = true;
    if (!pathOrUri) {
      setUrl(null);
      return;
    }
    signedUrl(bucket, pathOrUri)
      .then((u) => actief && setUrl(u))
      .catch(() => actief && setUrl(null));
    return () => {
      actief = false;
    };
  }, [bucket, pathOrUri]);
  return url;
}
