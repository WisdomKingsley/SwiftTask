import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userRole');
    router.replace('/login');
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity>
          <Text style={styles.edit}>Edit</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>TK</Text>
          </View>
          <Text style={styles.name}>Tunde Kadiri</Text>
          <Text style={styles.joined}>Joined March 2025 · Victoria Island, Lagos</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badgeVerified}>
              <Text style={styles.badgeVerifiedTxt}>✓ Phone Verified</Text>
            </View>
            <View style={styles.badgeTop}>
              <Text style={styles.badgeTopTxt}>★ Top Provider</Text>
            </View>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>47</Text>
            <Text style={styles.statLabel}>Jobs done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>5m</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Available now</Text>
              <Text style={styles.toggleSub}>{isOnline ? 'Visible to customers' : 'Hidden from feed'}</Text>
            </View>
            <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ false: '#2A2A38', true: '#FF5C00' }} thumbColor="#fff" />
          </View>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Skills</Text>
          <View style={styles.skillsRow}>
            {['Plumbing', 'Tiling', 'Electrical'].map(s => (
              <View key={s} style={styles.skillTag}>
                <Text style={styles.skillTxt}>{s}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addSkill}>
              <Text style={styles.addSkillTxt}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.referralBox}>
          <Text style={styles.refTitle}>Refer a friend — earn ₦500 each</Text>
          <Text style={styles.refSub}>Share your link. Both of you get rewarded.</Text>
          <View style={styles.refLinkRow}>
            <Text style={styles.refLinkTxt}>swifttask.ng/ref/tunde-x7k2</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={() => Alert.alert('Copied!', 'Link copied to clipboard')}>
              <Text style={styles.copyBtnTxt}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          {[
            { icon: '📋', label: 'My Requests' },
            { icon: '💼', label: 'My Jobs' },
            { icon: '⭐', label: 'Reviews' },
            { icon: '🔔', label: 'Notifications' },
            { icon: '🛡️', label: 'Privacy & Safety' },
            { icon: '❓', label: 'Help & Support' },
          ].map((item, i, arr) => (
            <TouchableOpacity key={i} style={[styles.menuItem, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutTxt}>Log out</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#2A2A38' },
  back: { color: '#FF5C00', fontSize: 15 },
  title: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  edit: { color: '#FF5C00', fontSize: 15 },
  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF5C0025', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTxt: { fontSize: 28, fontWeight: '800', color: '#FF5C00' },
  name: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  joined: { fontSize: 12, color: '#666', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badgeVerified: { backgroundColor: '#1D9E7520', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeVerifiedTxt: { fontSize: 12, color: '#1D9E75', fontWeight: '600' },
  badgeTop: { backgroundColor: '#FF5C0020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTopTxt: { fontSize: 12, color: '#FF5C00', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#1A1A22', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#2A2A38' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 3 },
  section: { backgroundColor: '#1A1A22', borderRadius: 14, marginHorizontal: 16, marginBottom: 14, padding: 16, borderWidth: 0.5, borderColor: '#2A2A38' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  toggleSub: { fontSize: 12, color: '#666', marginTop: 2 },
  divider: { height: 0.5, backgroundColor: '#2A2A38', marginVertical: 14 },
  sectionLabel: { fontSize: 12, color: '#666', marginBottom: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: '#7F77DD20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: '#7F77DD40' },
  skillTxt: { fontSize: 12, color: '#AFA9EC' },
  addSkill: { backgroundColor: '#2A2A38', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addSkillTxt: { fontSize: 12, color: '#666' },
  referralBox: { backgroundColor: '#1A1A22', borderRadius: 14, marginHorizontal: 16, marginBottom: 14, padding: 16, borderWidth: 0.5, borderColor: '#FF5C0050' },
  refTitle: { fontSize: 14, fontWeight: '700', color: '#FF5C00', marginBottom: 4 },
  refSub: { fontSize: 12, color: '#666', marginBottom: 12 },
  refLinkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F0F14', borderRadius: 8, padding: 10, borderWidth: 0.5, borderColor: '#2A2A38', gap: 10 },
  refLinkTxt: { flex: 1, fontSize: 12, color: '#888' },
  copyBtn: { backgroundColor: '#FF5C0020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  copyBtnTxt: { fontSize: 12, color: '#FF5C00', fontWeight: '600' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: '#2A2A38' },
  menuIcon: { fontSize: 18, width: 28 },
  menuLabel: { flex: 1, fontSize: 14, color: '#FFFFFF' },
  menuArrow: { fontSize: 18, color: '#444' },
  logoutBtn: { marginHorizontal: 16, backgroundColor: '#1A1A22', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 0.5, borderColor: '#2A2A38', marginBottom: 10 },
  logoutTxt: { color: '#E74C3C', fontSize: 15, fontWeight: '600' },
});