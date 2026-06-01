import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function ReferEarn() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('userPhone').then(phone => {
      if (phone) setReferralCode(phone.slice(-6).toUpperCase());
    });
  }, []);

  const referralLink = `swifttask.ng/ref/${referralCode}`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.brand, fontSize: 15 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>Refer & Earn</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: theme.brand, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>🎁</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 }}>Earn ₦500 per referral</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 }}>
            Invite friends to SwiftTask. When they complete their first job, you both get ₦500.
          </Text>
        </View>

        <View style={{ backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: theme.border }}>
          <Text style={{ fontSize: 11, color: theme.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Your Referral Link</Text>
          <View style={{ backgroundColor: theme.bg, borderRadius: 10, padding: 14, borderWidth: 0.5, borderColor: theme.border, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: theme.brand, fontWeight: '700', fontFamily: 'monospace' }}>{referralLink}</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: theme.brand, borderRadius: 10, padding: 14, alignItems: 'center' }}
            onPress={() => Alert.alert('Copied!', `${referralLink} copied to clipboard!`)}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Copy Link 📋</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: theme.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: theme.border }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 14 }}>How it works</Text>
          {[
            { step: '1', title: 'Share your link', desc: 'Send your referral link to friends via WhatsApp, SMS, or any platform.' },
            { step: '2', title: 'They sign up', desc: 'Your friend downloads SwiftTask and creates an account using your link.' },
            { step: '3', title: 'First job completed', desc: 'Once they complete their first job on SwiftTask, the reward is triggered.' },
            { step: '4', title: 'Both get ₦500', desc: 'You receive ₦500 airtime. They receive ₦500 off their next job.' },
          ].map(item => (
            <View key={item.step} style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.brand + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.brand }}>{item.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 2 }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: theme.text3, lineHeight: 17 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: theme.card, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: theme.border }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8 }}>Your Referral Stats</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[{ num: '0', label: 'Referred' }, { num: '₦0', label: 'Earned' }, { num: '0', label: 'Pending' }].map((s, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: theme.border }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: theme.brand }}>{s.num}</Text>
                <Text style={{ fontSize: 10, color: theme.text3, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
