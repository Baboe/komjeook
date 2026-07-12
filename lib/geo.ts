import * as Location from 'expo-location';

// Stadsnaam -> centroïde-coördinaten. Bewust grof (stadsniveau): we bewaren
// nooit een exact woonadres, alleen de stad die de gebruiker zelf opgeeft.
export async function geocodeStad(stad: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await Location.geocodeAsync(stad.trim());
    if (res[0]) return { lat: res[0].latitude, lng: res[0].longitude };
  } catch {
    // geen verbinding of geocoder niet beschikbaar — radius-filter valt dan stil terug op alles tonen
  }
  return null;
}
