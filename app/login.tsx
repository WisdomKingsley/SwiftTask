import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const DEMO_ACCOUNTS = {
  'customer123': { role: 'customer', phone: '+2340000000001', name: 'Demo Customer' },
  'provider123': { role: 'provider', phone: '+2340000000002', name: 'Demo Provider' },
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('userRole').then(role => {
      AsyncStorage.getItem('userPhone').then(p => {
        if (role && p) router.replace(role === 'provider' ? '/provider-home' : '/(tabs)/');
        else setLoading(false);
      });
    });
  }, []);

  const handleDemoAccess = async (code: keyof typeof DEMO_ACCOUNTS) => {
    const account = DEMO_ACCOUNTS[code];
    try {
      const snap = await getDoc(doc(db, 'users', account.phone));
      if (!snap.exists()) {
        await setDoc(doc(db, 'users', account.phone), {
          phone: account.phone, role: account.role, name: account.name,
          email: 'demo@swifttask.ng', createdAt: new Date().toISOString(),
          location: { area: 'Victoria Island', lat: 6.4281, lng: 3.4219 },
          stats: { jobsCompleted:0,jobsPosted:0,rating:0,ratingCount:0,responseRate:0,completionRate:0,disputeRate:0,cancellationRate:0,responseCount:0 },
          badges: { phoneVerified:true },
          providerProfile: { skills:['Plumbing','Electrical'],radiusKm:10,isOnline:true,responseTimeMins:5,avgPrice:8500,serviceMode:'mobile' },
          isOnline: account.role==='provider', fcmToken:'', referralCode:'DEMO01', isActive:true,
        });
      }
    } catch {}
    await AsyncStorage.setItem('userRole', account.role);
    await AsyncStorage.setItem('userPhone', account.phone);
    await AsyncStorage.setItem('userName', account.name);
    router.replace(account.role === 'provider' ? '/provider-home' : '/(tabs)/');
  };

  const handleLogin = () => {
    if (phone.trim().length < 8) return;
    const formatted = phone.startsWith('+') ? phone : '+234' + phone.replace(/^0/, '');
    router.push({ pathname: '/otp', params: { phone: formatted, mode: 'login' } });
  };

  if (loading) return (
    <View style={{ flex:1, backgroundColor: '#000000', alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator color={theme.brand} size="large" />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex:1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <View style={{ paddingTop: 20, paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 42, fontWeight: '800', color: theme.brand, letterSpacing: -1.5 }}>SwiftTask</Text>
          <Text style={{ fontSize: 16, color: theme.text3, marginTop: 8, letterSpacing: 0.2 }}>
            Get anything done near you
          </Text>

          {/* Live indicator */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            marginTop: 20, paddingHorizontal: 16, paddingVertical: 8,
            borderRadius: 20, borderWidth: 1,
            backgroundColor: isDark ? 'rgba(46,204,113,0.08)' : 'rgba(46,204,113,0.06)',
            borderColor: 'rgba(46,204,113,0.25)',
          }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: theme.green }} />
            <Text style={{ fontSize: 13, color: theme.green, fontWeight: '500' }}>247 providers active in Lagos</Text>
          </View>
        </View>

        {/* VALUE PROPS — clean, minimal, no clutter */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
          {[
            { label: 'Instant', desc: 'Offers in minutes' },
            { label: 'Verified', desc: 'Rated providers' },
            { label: 'Local', desc: 'Near you always' },
          ].map((p, i) => (
            <View key={i} style={{
              flex: 1, paddingVertical: 16, paddingHorizontal: 10,
              backgroundColor: theme.card, borderRadius: 14,
              borderWidth: 0.5, borderColor: theme.border,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 3 }}>{p.label}</Text>
              <Text style={{ fontSize: 11, color: theme.text3, textAlign: 'center' }}>{p.desc}</Text>
            </View>
          ))}
        </View>

        {/* LOGIN CARD */}
        <View style={{
          backgroundColor: theme.card, borderRadius: 20,
          padding: 24, borderWidth: 0.5, borderColor: theme.border,
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 4 }}>Welcome back</Text>
          <Text style={{ fontSize: 14, color: theme.text3, marginBottom: 24 }}>Sign in to continue</Text>

          <Text style={{ fontSize: 11, color: theme.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' }}>
            Phone Number
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.bg, borderRadius: 12, padding: 15,
              fontSize: 16, color: theme.text, borderWidth: 0.5,
              borderColor: theme.border, marginBottom: 16,
            }}
            placeholder="+234 080 0000 0000"
            placeholderTextColor={theme.text3}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            autoFocus
          />

          <TouchableOpacity
            style={{
              backgroundColor: theme.brand, borderRadius: 12,
              padding: 16, alignItems: 'center',
              opacity: phone.trim().length < 8 ? 0.5 : 1,
            }}
            onPress={handleLogin}
            disabled={phone.trim().length < 8}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Continue →</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 }}>
            <View style={{ flex: 1, height: 0.5, backgroundColor: theme.border }} />
            <Text style={{ fontSize: 12, color: theme.text3 }}>Don't have an account?</Text>
            <View style={{ flex: 1, height: 0.5, backgroundColor: theme.border }} />
          </View>

          <TouchableOpacity
            style={{
              borderWidth: 1.5, borderColor: theme.brand,
              borderRadius: 12, padding: 15, alignItems: 'center',
            }}
            onPress={() => router.push('/signup')}>
            <Text style={{ color: theme.brand, fontSize: 16, fontWeight: '700' }}>Create an Account</Text>
          </TouchableOpacity>
        </View>

        {/* Beta Access */}
        <TouchableOpacity onPress={() => setShowDemo(!showDemo)} style={{ alignItems: 'center', paddingVertical: 10 }}>
          <Text style={{ fontSize: 11, color: theme.border }}>Beta Access</Text>
        </TouchableOpacity>

        {showDemo && (
          <View style={{
            backgroundColor: theme.card, borderRadius: 16, padding: 16,
            marginTop: 4, borderWidth: 0.5, borderColor: theme.brand + '40',
          }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 3 }}>Demo Access</Text>
            <Text style={{ fontSize: 12, color: theme.text3, marginBottom: 14 }}>For testing only</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: 13, alignItems: 'center', borderWidth: 0.5, borderColor: theme.border }}
                onPress={() => handleDemoAccess('customer123')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 2 }}>Customer</Text>
                <Text style={{ fontSize: 11, color: theme.text3 }}>Demo access</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: 13, alignItems: 'center', borderWidth: 0.5, borderColor: theme.brand }}
                onPress={() => handleDemoAccess('provider123')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.brand, marginBottom: 2 }}>Provider</Text>
                <Text style={{ fontSize: 11, color: theme.text3 }}>Demo access</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
