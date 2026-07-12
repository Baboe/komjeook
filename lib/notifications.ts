import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Registreert het Expo-pushtoken voor deze gebruiker. Doet stil niets als er
// nog geen EAS-project gekoppeld is (eas init) of op een simulator.
export async function registreerPush(userId: string): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
    if (!projectId) return;

    const bestaand = await Notifications.getPermissionsAsync();
    let status = bestaand.status;
    if (status !== 'granted') {
      const gevraagd = await Notifications.requestPermissionsAsync();
      status = gevraagd.status;
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('standaard', {
        name: 'Meldingen',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#C4614A',
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from('push_tokens').upsert({
      user_id: userId,
      token,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // push is nooit reden om de app te blokkeren
  }
}

export type PushData = {
  type?: 'reactie' | 'gekozen' | 'vervuld' | 'bericht' | 'feedback' | 'verlopen';
  chat_id?: string;
  oproep_id?: string;
};

// Bepaal de route bij het tikken op een melding. IDs zijn veilig om mee te
// navigeren: RLS bepaalt server-side wat de gebruiker daadwerkelijk mag zien.
export function routeVoorPush(data: PushData): string | null {
  if (data.chat_id) return `/chat/${data.chat_id}`;
  if (data.type === 'feedback' && data.oproep_id) return `/feedback/${data.oproep_id}`;
  if (data.oproep_id) return `/oproep/${data.oproep_id}`;
  return null;
}
