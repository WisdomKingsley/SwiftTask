import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const ALL_SKILLS = [
  { id:'inverter_solar',      icon:'🔋', label:'Inverter & Solar' },
  { id:'ac_specialist',       icon:'❄️', label:'AC Specialist' },
  { id:'generator_mechanic',  icon:'⚡', label:'Generator Mechanic' },
  { id:'deep_cleaning',       icon:'🧼', label:'Deep Cleaning' },
  { id:'borehole_plumbing',   icon:'🚰', label:'Borehole & Plumbing' },
  { id:'smart_home_cctv',     icon:'👨‍💻', label:'Smart Home & CCTV' },
  { id:'vehicle_diagnostics', icon:'🚗', label:'Vehicle Diagnostics' },
  { id:'elite_barber_hair',   icon:'💈', label:'Barber & Hair Pro' },
  { id:'luxury_nail_spa',     icon:'💅', label:'Nail & Spa' },
  { id:'secured_logistics',   icon:'📦', label:'Logistics & Courier' },
];

const SERVICE_MODES = [
  { id: 'mobile', label: '🚗 Mobile', sub: 'I travel to the customer' },
  { id: 'fixed', label: '📍 Fixed Location', sub: 'Customer comes to me' },
  { id: 'both', label: '🔄 Both', sub: 'I can do either' },
];

export default function EditProviderProfile() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [serviceMode, setServiceMode] = useState('mobile');
  const [workRadius, setWorkRadius] = useState('5');

  useEffect(() => {
    const load = async () => {
      const p = await AsyncStorage.getItem('userPhone') || '';
      const n = await AsyncStorage.getItem('userName') || '';
      setPhone(p);
      setName(n);
    };
    load();
  }, []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow access to your photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Name cannot be empty'); return; }
    if (selectedSkills.length === 0) { Alert.alert('Required', 'Please select at least one skill'); return; }
    setSaving(true);
    try {
      if (phone) {
        await updateDoc(doc(db, 'users', phone), {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          bio: bio.trim(),
          location: { area: location.trim(), lat: 6.5244, lng: 3.3792 },
          'providerProfile.skills': selectedSkills,
          'providerProfile.serviceMode': serviceMode,
          'providerProfile.radiusKm': parseInt(workRadius) || 5,
        });
      }
      await AsyncStorage.setItem('userName', name.trim());
      Alert.alert('Saved!', 'Profile updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Error', 'Could not save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.safe, { paddingTop: insets.top, backgroundColor: theme.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={[styles.title, {color:theme.text}]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.save, saving && { opacity: 0.5 }]}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.photoSection} onPress={() => Alert.alert('Change Photo', '', [
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Library', onPress: pickImage },
          { text: 'Cancel', style: 'cancel' },
        ])}>
          {image
            ? <Image source={{ uri: image }} style={styles.photo} />
            : <View style={[styles.photoPlaceholder, { backgroundColor: theme.brand + "25" }]}>
                <Text style={styles.photoInitials}>{name ? name[0].toUpperCase() : '?'}</Text>
              </View>}
          <View style={styles.cameraBtn}><Text style={{ fontSize: 16 }}>📷</Text></View>
          <Text style={styles.changePhotoTxt}>Tap to change photo</Text>
        </TouchableOpacity>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text3 }]}>Personal Information</Text>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Full Name *</Text>
          <TextInput style={[styles.input, {backgroundColor:theme.inputBg, color:theme.text, borderColor:theme.border}]} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#555" autoCapitalize="words" />
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Email Address</Text>
          <TextInput style={[styles.input, {backgroundColor:theme.inputBg, color:theme.text, borderColor:theme.border}]} value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" />
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Phone Number</Text>
          <View style={[styles.input, { opacity: 0.5 }]}>
            <Text style={{ color: '#888', fontSize: 14 }}>{phone}</Text>
          </View>
          <Text style={[styles.fieldHint, { color: theme.text3 }]}>Phone number cannot be changed</Text>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Your Base Area</Text>
          <TextInput style={[styles.input, {backgroundColor:theme.inputBg, color:theme.text, borderColor:theme.border}]} value={location} onChangeText={setLocation} placeholder="e.g. Lekki Phase 1, Lagos" placeholderTextColor="#555" />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text3 }]}>Professional Bio</Text>
          <Text style={[styles.fieldHint, { color: theme.text3 }]}>Describe your experience — customers read this before hiring you</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            value={bio}
            onChangeText={setBio}
            placeholder="e.g. Certified plumber with 7 years experience in Lagos. Specialise in burst pipes and bathroom installations..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text3 }]}>Your Skills *</Text>
          <Text style={[styles.fieldHint, { color: theme.text3 }]}>Select all that apply — be honest, customers depend on this</Text>
          <View style={styles.skillsGrid}>
            {ALL_SKILLS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.skillBtn, { backgroundColor: theme.bg, borderColor: theme.border }, selectedSkills.includes(s.id) && styles.skillBtnActive]}
                onPress={() => toggleSkill(s.id)}>
                <Text style={styles.skillIcon}>{s.icon}</Text>
                <Text style={[styles.skillTxt, { color: theme.text3 }, selectedSkills.includes(s.id) && styles.skillTxtActive]}>{s.id}</Text>
                {selectedSkills.includes(s.id) && <Text style={{ fontSize: 10, color: '#FF5C00' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text3 }]}>How You Work</Text>
          {SERVICE_MODES.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.modeBtn, { backgroundColor: theme.bg, borderColor: theme.border }, serviceMode === m.id && styles.modeBtnActive]}
              onPress={() => setServiceMode(m.id)}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modeTxt, serviceMode === m.id && { color: theme.text }]}>{m.label}</Text>
                <Text style={[styles.modeSub, { color: theme.text3 }]}>{m.sub}</Text>
              </View>
              {serviceMode === m.id && <Text style={{ color: '#FF5C00', fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}

          <Text style={[styles.fieldLabel, { marginTop: 16, color: theme.text }]}>Work Radius (km)</Text>
          <TextInput
            style={[styles.input, {backgroundColor:theme.inputBg, color:theme.text, borderColor:theme.border}]}
            value={workRadius}
            onChangeText={setWorkRadius}
            placeholder="5"
            placeholderTextColor="#555"
            keyboardType="number-pad"
          />
          <Text style={[styles.fieldHint, { color: theme.text3 }]}>How far are you willing to travel for a job?</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text3 }]}>Account Actions</Text>
          <TouchableOpacity style={styles.dangerItem}>
            <Text style={styles.dangerTxt}>Deactivate Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerItem, { borderBottomWidth: 0 }]}>
            <Text style={[styles.dangerTxt, { color: '#E74C3C' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#2A2A38' },
  cancel: { color: '#888', fontSize: 15 },
  title: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  save: { color: '#FF5C00', fontSize: 15, fontWeight: '700' },
  content: { padding: 16 },
  photoSection: { alignItems: 'center', paddingVertical: 28 },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FF5C0025', alignItems: 'center', justifyContent: 'center' },
  photoInitials: { fontSize: 38, fontWeight: '800', color: '#FF5C00' },
  cameraBtn: { position: 'absolute', bottom: 22, right: '34%', width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF5C00', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0F0F14' },
  changePhotoTxt: { fontSize: 13, color: '#FF5C00', marginTop: 10, fontWeight: '600' },
  section: { backgroundColor: '#1A1A22', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: '#2A2A38' },
  sectionTitle: { fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: '#aaa', marginBottom: 7, marginTop: 14 },
  fieldHint: { fontSize: 11, color: '#555', marginBottom: 8, marginTop: 4, lineHeight: 16 },
  input: { backgroundColor: '#0F0F14', borderRadius: 10, padding: 14, fontSize: 14, color: '#FFFFFF', borderWidth: 0.5, borderColor: '#2A2A38' },
  textarea: { minHeight: 100, textAlignVertical: 'top', lineHeight: 22 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  skillBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, backgroundColor: '#0F0F14', borderWidth: 0.5, borderColor: '#2A2A38' },
  skillBtnActive: { borderColor: '#FF5C00', backgroundColor: '#FF5C0015' },
  skillIcon: { fontSize: 14 },
  skillTxt: { fontSize: 12, color: '#666' },
  skillTxtActive: { color: '#FF5C00', fontWeight: '600' },
  modeBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, backgroundColor: '#0F0F14', borderWidth: 0.5, borderColor: '#2A2A38', marginBottom: 8 },
  modeBtnActive: { borderColor: '#FF5C00', backgroundColor: '#FF5C0015' },
  modeTxt: { fontSize: 13, color: '#666', fontWeight: '600' },
  modeSub: { fontSize: 11, color: '#555', marginTop: 2 },
  dangerItem: { paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#2A2A38' },
  dangerTxt: { fontSize: 14, color: '#888' },
});
