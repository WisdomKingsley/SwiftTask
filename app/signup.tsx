import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [step, setStep] = useState<'details'|'otp'>('details');
  const [role, setRole] = useState<'customer'|'provider'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const startCountdown = () => {
    setCountdown(30);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const validateDetails = () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Required', 'Please enter your full name'); return false;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      Alert.alert('Required', 'Please enter a valid phone number'); return false;
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert('Invalid email', 'Please enter a valid email address'); return false;
      }
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateDetails()) return;
    setLoading(true);
    try {
      const formatted = phone.startsWith('+') ? phone : '+234' + phone.replace(/^0/, '');
      const userRef = doc(db, 'users', formatted);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        Alert.alert(
          'Account exists',
          'This phone number already has an account. Please log in instead.',
          [{ text: 'Log In', onPress: () => router.replace('/login') }, { text: 'Cancel', style: 'cancel' }]
        );
        setLoading(false);
        return;
      }
      setPhone(formatted);
      setStep('otp');
      startCountdown();
    } catch {
      Alert.alert('Error', 'Could not connect. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async () => {
    if (otp.length < 6) { Alert.alert('Error', 'Enter the 6-digit OTP'); return; }
    if (otp !== '123456') { Alert.alert('Wrong code', 'Please enter the correct OTP.'); return; }
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', phone), {
        phone,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        createdAt: new Date().toISOString(),
        location: { area: 'Lagos', lat: 6.5244, lng: 3.3792 },
        stats: {
          jobsCompleted: 0, rating: 0, ratingCount: 0,
          responseRate: 0, completionRate: 0,
          disputeRate: 0, cancellationRate: 0, responseCount: 0,
        },
        badges: { phoneVerified: true, topProvider: false, trusted: false },
        providerProfile: {
          skills: [], radiusKm: 5, isOnline: false,
          responseTimeMins: 0, avgPrice: 0, serviceMode: 'mobile',
        },
        isOnline: false,
        fcmToken: '',
        referralCode: phone.slice(-6),
        isActive: true,
      });

      await AsyncStorage.setItem('userRole', role);
      await AsyncStorage.setItem('userPhone', phone);
      await AsyncStorage.setItem('userName', name.trim());

      // Providers go to fill in their skills next
      if (role === 'provider') {
        Alert.alert(
          'Welcome to SwiftTask! 🎉',
          'Account created! Please complete your provider profile to start receiving jobs.',
          [{ text: 'Complete Profile', onPress: () => router.replace('/edit-provider-profile') }]
        );
      } else {
        Alert.alert('Welcome to SwiftTask! 🎉', `Great to have you, ${name.split(' ')[0]}! Start by posting your first request.`, [
          { text: "Let's go!", onPress: () => router.replace('/(tabs)/') }
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not create account. Try again.');
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: OTP ──
  if (step === 'otp') {
    return (
      <View style={[styles.safe, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
          <TouchableOpacity onPress={() => setStep('details')} style={styles.back}>
            <Text style={[styles.backTxt, {color:theme.brand}]}>← Back</Text>
          </TouchableOpacity>

          <View style={[styles.otpHero, {backgroundColor:theme.bg}]}>
            <Text style={[styles.otpTitle, {color:theme.text}]}>Verify your number</Text>
            <Text style={[styles.otpSub, {color:theme.text3}]}>We sent a 6-digit code to</Text>
            <Text style={styles.otpPhone}>{phone}</Text>
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

          <Text style={[styles.otpHint, {color:theme.text3}]}>Enter 123456 to continue (beta)</Text>

          <TouchableOpacity
            style={[styles.primaryBtn, (loading || otp.length < 6) && { opacity: 0.5 }]}
            onPress={handleVerifyAndCreate}
            disabled={loading || otp.length < 6}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnTxt}>Create My Account →</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { if (canResend) startCountdown(); }}
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

  // ── STEP 1: Account details ──
  return (
    <KeyboardAvoidingView style={[styles.safe, { paddingTop: insets.top, backgroundColor: theme.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

        <View style={[styles.signupHeader, {backgroundColor:theme.bg, borderBottomColor:theme.border}]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backTxt, {color:theme.brand}]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.signupLogoTxt, {color:theme.brand}]}>SwiftTask</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={[styles.signupHero, {backgroundColor:theme.bg}]}>
          <Text style={[styles.signupTitle, {color:theme.text}]}>Create your account</Text>
          <Text style={[styles.signupSub, {color:theme.text3}]}>Join thousands of Lagosians getting things done faster</Text>
        </View>

        {/* Role selection */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, {color:theme.text3}]}>I want to</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
              onPress={() => setRole('customer')}>
              <Text style={styles.roleIcon}>🛒</Text>
              <Text style={[styles.roleTxt, role === 'customer' && styles.roleTxtActive]}>Hire Help</Text>
              <Text style={[styles.roleDesc, {color:theme.text3}]}>Post jobs, find and hire verified local providers quickly</Text>
              {role === 'customer' && <View style={styles.roleCheck}><Text style={{ color: theme.text, fontSize: 10, fontWeight: '700' }}>✓</Text></View>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'provider' && styles.roleBtnActive]}
              onPress={() => setRole('provider')}>
              <Text style={styles.roleIcon}>💼</Text>
              <Text style={[styles.roleTxt, role === 'provider' && styles.roleTxtActive]}>Earn Money</Text>
              <Text style={[styles.roleDesc, {color:theme.text3}]}>Offer your skills, find jobs nearby, and get paid fast</Text>
              {role === 'provider' && <View style={styles.roleCheck}><Text style={{ color: theme.text, fontSize: 10, fontWeight: '700' }}>✓</Text></View>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Personal details */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, {color:theme.text3}]}>Your Details</Text>

          <Text style={[styles.fieldLabel, { color: theme.text }]}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Tunde Kadiri"
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
          />

          <Text style={[styles.fieldLabel, { color: theme.text }]}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="+234 080 0000 0000"
            placeholderTextColor="#555"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={[styles.fieldLabel, { color: theme.text }]}>Email Address (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={[styles.fieldHint, {color:theme.text3}]}>Used for receipts and account recovery</Text>
        </View>

        {/* Trust signals */}
        <View style={styles.trustRow}>
          {[
            { icon: '🔒', txt: 'Your data is encrypted and secure' },
            { icon: '✓', txt: 'We never share your phone number' },
            { icon: '🚫', txt: 'No spam. Unsubscribe anytime' },
          ].map((t, i) => (
            <View key={i} style={[styles.trustItem, {backgroundColor:theme.card, borderColor:theme.border}]}>
              <Text style={styles.trustIcon}>{t.icon}</Text>
              <Text style={[styles.trustTxt, {color:theme.text3}]}>{t.txt}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, (loading || !name.trim() || phone.trim().length < 8) && { opacity: 0.5 }]}
          onPress={handleSendOTP}
          disabled={loading || !name.trim() || phone.trim().length < 8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnTxt}>Send Verification Code →</Text>}
        </TouchableOpacity>

        <TouchableOpacity
              style={{ flexDirection:'row', alignItems:'flex-start', gap:10, marginBottom:14 }}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.8}>
              <View style={{
                width:20, height:20, borderRadius:5, borderWidth:1.5,
                borderColor: agreedToTerms ? theme.brand : theme.border,
                backgroundColor: agreedToTerms ? theme.brand : 'transparent',
                alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1
              }}>
                {agreedToTerms && <Text style={{color:'#fff', fontSize:12, fontWeight:'700'}}>✓</Text>}
              </View>
              <Text style={{fontSize:12, color:theme.text3, flex:1, lineHeight:18}}>
                I have read and agree to the{' '}
                <Text style={{color:theme.brand, fontWeight:'600'}} onPress={() => router.push('/terms-of-service')}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{color:theme.brand, fontWeight:'600'}} onPress={() => router.push('/privacy-policy')}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/login')}>
          <Text style={styles.loginLinkTxt}>Already have an account? <Text style={{ color: '#FF5C00', fontWeight: '700' }}>Log in</Text></Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F14' },
  container: { flex: 1, padding: 24 },
  scrollContainer: { padding: 20 },
  signupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backTxt: { color: '#FF5C00', fontSize: 15 },
  signupLogoTxt: { fontSize: 20, fontWeight: '800', color: '#FF5C00' },
  signupHero: { marginBottom: 24 },
  signupTitle: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, lineHeight: 34 },
  signupSub: { fontSize: 14, color: '#666', lineHeight: 20 },
  card: { backgroundColor: '#1A1A22', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: '#2A2A38' },
  sectionLabel: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: '#2A2A38', backgroundColor: '#0F0F14', alignItems: 'center', gap: 6, position: 'relative' },
  roleBtnActive: { borderColor: '#FF5C00', backgroundColor: '#FF5C0015' },
  roleIcon: { fontSize: 28 },
  roleTxt: { fontSize: 14, fontWeight: '700', color: '#666' },
  roleTxtActive: { color: '#FF5C00' },
  roleDesc: { fontSize: 10, color: '#555', textAlign: 'center', lineHeight: 14 },
  roleCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF5C00', alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 12, color: '#aaa', marginBottom: 7, marginTop: 14 },
  fieldHint: { fontSize: 11, color: '#555', marginTop: 5 },
  input: { backgroundColor: '#0F0F14', borderRadius: 10, padding: 14, fontSize: 15, color: '#FFFFFF', borderWidth: 0.5, borderColor: '#2A2A38' },
  trustRow: { gap: 8, marginBottom: 20 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustIcon: { fontSize: 14 },
  trustTxt: { fontSize: 12, color: '#555' },
  primaryBtn: { backgroundColor: '#FF5C00', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 14 },
  primaryBtnTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  legal: { fontSize: 11, color: '#444', textAlign: 'center', lineHeight: 17, marginBottom: 16 },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkTxt: { fontSize: 14, color: '#666' },
  back: { marginBottom: 28 },
  otpHero: { marginBottom: 28 },
  otpTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  otpSub: { fontSize: 14, color: '#888' },
  otpPhone: { fontSize: 16, color: '#FF5C00', fontWeight: '700', marginTop: 4 },
  otpInput: { backgroundColor: '#1A1A22', borderRadius: 14, padding: 20, fontSize: 32, color: '#FFFFFF', borderWidth: 0.5, borderColor: '#2A2A38', letterSpacing: 12, marginBottom: 10 },
  otpHint: { fontSize: 12, color: '#FF5C00', textAlign: 'center', marginBottom: 20 },
  resend: { color: '#FF5C00', fontSize: 13, textAlign: 'center' },
});
