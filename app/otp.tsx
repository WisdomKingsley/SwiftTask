import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

// ─── BETA FLAG — set to false before public launch ───
const IS_BETA = true;

type Step = 'otp' | 'profile';

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { phone, role, mode } = useLocalSearchParams<{ phone: string; role: string; mode: string }>();
  const [step, setStep] = useState<Step>('otp');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (otp.length < 6) { Alert.alert('Error', 'Enter the 6-digit code'); return; }
    if (otp !== '123456') { Alert.alert('Wrong code', 'Please enter the correct OTP.'); return; }
    setLoading(true);
    try {
      const userRef = doc(db, 'users', phone as string);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setStep('profile');
        setLoading(false);
        return;
      }

      const existingRole = userSnap.data().role;
      await AsyncStorage.setItem('userRole', existingRole);
      await AsyncStorage.setItem('userPhone', phone as string);
      await AsyncStorage.setItem('userName', userSnap.data().name || '');

      if (existingRole !== role && role) {
        Alert.alert('Account found', `This number is registered as a ${existingRole}. Logging you in as ${existingRole}.`);
      }
      router.replace(existingRole === 'provider' ? '/provider-home' : '/(tabs)/');
    } catch (e: any) {
      Alert.alert('Error', 'Could not connect. Check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Required', 'Please enter your full name'); return;
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert('Invalid email', 'Please enter a valid email address'); return;
      }
    }
    setLoading(true);
    try {
      const userRef = doc(db, 'users', phone as string);
      await setDoc(userRef, {
        phone, role, name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
        location: { area: 'Lagos', lat: 6.5244, lng: 3.3792 },
        stats: {
          jobsCompleted: 0, jobsPosted: 0, rating: 0, ratingCount: 0,
          responseRate: 0, completionRate: 0, disputeRate: 0,
          cancellationRate: 0, responseCount: 0,
        },
        badges: { phoneVerified: true, topProvider: false, trusted: false },
        providerProfile: {
          skills: [], radiusKm: 5, isOnline: false,
          responseTimeMins: 0, avgPrice: 0, serviceMode: 'mobile',
        },
        isOnline: false, fcmToken: '',
        referralCode: (phone as string).slice(-6),
        isActive: true,
      });
      await AsyncStorage.setItem('userRole', role as string);
      await AsyncStorage.setItem('userPhone', phone as string);
      await AsyncStorage.setItem('userName', name.trim());
      router.replace(role === 'provider' ? '/edit-provider-profile' : '/(tabs)/');
    } catch (e: any) {
      Alert.alert('Error', 'Could not create account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'profile') {
    return (
      <KeyboardAvoidingView
        style={[styles.safe, { paddingTop: insets.top, backgroundColor: theme.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, {backgroundColor:theme.bg}]}>
            <Text style={[styles.stepBadge, {color:theme.brand}]}>Almost there 🎉</Text>
            <Text style={[styles.title, { color: theme.text }]}>Create your profile</Text>
            <Text style={[styles.sub, {color:theme.text3}]}>This helps providers know who they're working with</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.text }]}>Full Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Tunde Kadiri" placeholderTextColor="#555" value={name} onChangeText={setName} autoCapitalize="words" autoFocus />
            <Text style={[styles.label, { color: theme.text }]}>Email Address (optional)</Text>
            <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#555" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Text style={[styles.fieldHint, {color:theme.text3}]}>Used for receipts and account recovery</Text>
            <View style={[styles.infoBox, {backgroundColor:theme.card, borderColor:theme.border}]}>
              <Text style={[styles.infoTxt, {color:theme.text3}]}>📱 {phone}</Text>
              <View style={[styles.rolePill, { backgroundColor: role === 'provider' ? '#FF5C0020' : '#1D9E7520' }]}>
                <Text style={{ fontSize: 12, color: role === 'provider' ? '#FF5C00' : '#1D9E75', fontWeight: '600' }}>
                  {role === 'provider' ? '💼 Provider' : '🛒 Customer'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.btn, (loading || name.trim().length < 2) && { opacity: 0.5 }]}
              onPress={handleProfileSubmit}
              disabled={loading || name.trim().length < 2}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Create Account →</Text>}
            </TouchableOpacity>
            <Text style={[styles.legal, {color:theme.text3}]}>By creating an account you agree to our Terms of Service and Privacy Policy</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.safe, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backTxt, {color:theme.brand}]}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.hero, {backgroundColor:theme.bg}]}>
          <Text style={[styles.title, { color: theme.text }]}>Verify your number</Text>
          <Text style={[styles.sub, {color:theme.text3}]}>6-digit code sent to</Text>
          <Text style={[styles.phone, {color:theme.brand}]}>{phone}</Text>
          <View style={[styles.rolePill, { backgroundColor: role === 'provider' ? '#FF5C0020' : '#1D9E7520' }]}>
            <Text style={{ fontSize: 13, color: role === 'provider' ? '#FF5C00' : '#1D9E75', fontWeight: '600' }}>
              {role === 'provider' ? '💼 Provider account' : '🛒 Customer account'}
            </Text>
          </View>
        </View>
        <TextInput
          style={styles.otpInput}
          placeholder="• • • • • •"
          placeholderTextColor="#555"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          textAlign="center"
          autoFocus
        />

        {/* BETA hint — hidden in production */}
        {IS_BETA && (
          <View style={[styles.betaHint, {backgroundColor:theme.card, borderColor:theme.border}]}>
            <Text style={[styles.betaHintTxt, {color:theme.text3}]}>🔧 Beta mode — use code: 123456</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, (loading || otp.length < 6) && { opacity: 0.5 }]}
          onPress={handleVerify}
          disabled={loading || otp.length < 6}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Verify →</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setCountdown(30); setCanResend(false); }}
          disabled={!canResend}
          style={{ marginTop: 16 }}>
          <Text style={[styles.resend, !canResend && { color: '#444' }]}>
            {canResend ? 'Resend code' : `Resend in ${countdown}s`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#0F0F14'},
  container:{flex:1,padding:24},
  back:{marginBottom:28},
  backTxt:{color:'#FF5C00',fontSize:15},
  hero:{marginBottom:28},
  stepBadge:{fontSize:13,color:'#FF5C00',fontWeight:'600',marginBottom:8},
  title:{fontSize:26,fontWeight:'800',color:'#FFFFFF',marginBottom:8},
  sub:{fontSize:14,color:'#888'},
  phone:{fontSize:16,color:'#FF5C00',fontWeight:'700',marginTop:4,marginBottom:10},
  rolePill:{paddingHorizontal:12,paddingVertical:6,borderRadius:20,alignSelf:'flex-start'},
  card:{backgroundColor:'#1A1A22',borderRadius:16,padding:20,borderWidth:0.5,borderColor:'#2A2A38'},
  label:{fontSize:11,color:'#666',marginBottom:8,marginTop:14,textTransform:'uppercase',letterSpacing:0.6},
  input:{backgroundColor:'#0F0F14',borderRadius:10,padding:14,fontSize:15,color:'#FFFFFF',borderWidth:0.5,borderColor:'#2A2A38'},
  fieldHint:{fontSize:11,color:'#555',marginTop:4},
  infoBox:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:'#0F0F14',borderRadius:10,padding:12,marginTop:16,borderWidth:0.5,borderColor:'#2A2A38'},
  infoTxt:{fontSize:13,color:'#888'},
  otpInput:{backgroundColor:'#1A1A22',borderRadius:14,padding:20,fontSize:32,color:'#FFFFFF',borderWidth:0.5,borderColor:'#2A2A38',letterSpacing:12,marginBottom:12},
  betaHint:{backgroundColor:'#FF5C0015',borderRadius:8,padding:10,marginBottom:16,alignItems:'center',borderWidth:0.5,borderColor:'#FF5C0040'},
  betaHintTxt:{fontSize:12,color:'#FF5C00',fontWeight:'600'},
  btn:{backgroundColor:'#FF5C00',borderRadius:12,padding:16,alignItems:'center',marginBottom:8},
  btnTxt:{color:'#fff',fontSize:16,fontWeight:'700'},
  legal:{fontSize:11,color:'#444',textAlign:'center',marginTop:12,lineHeight:17},
  resend:{color:'#FF5C00',fontSize:13,textAlign:'center'},
});
