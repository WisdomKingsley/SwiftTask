import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as Location from 'expo-location';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const { theme } = useTheme();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const savedRole = await AsyncStorage.getItem('userRole');
      const savedPhone = await AsyncStorage.getItem('userPhone');
      setRole(savedRole || 'customer');
      setLoading(false);

      // Save real GPS to Firestore silently
      if (savedPhone) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const geocode = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            const place = geocode[0];
            const area = place?.district || place?.city || 'Lagos';
            await updateDoc(doc(db, 'users', savedPhone), {
              location: { lat: loc.coords.latitude, lng: loc.coords.longitude, area, country: place?.country || 'Nigeria' },
              lastSeen: new Date().toISOString(),
            });
          }
        } catch (e) {
          // Silent fail — GPS update is best-effort
        }
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F14', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF5C00" size="large" />
      </View>
    );
  }

  if (role === 'provider') return <Redirect href="/provider-home" />;
  return <Redirect href="/(tabs)/" />;
}
