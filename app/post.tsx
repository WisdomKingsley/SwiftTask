import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db, getExpiryHours, CATEGORY_PRICE_CONFIG } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = [
  { id:'inverter_solar',      icon:'🔋', label:'Inverter & Solar',       keywords:['inverter','solar','panel','battery','ups','power backup'] },
  { id:'ac_specialist',       icon:'❄️', label:'AC Specialist',           keywords:['ac','air condition','split unit','cooling','aircon','hvac'] },
  { id:'generator_mechanic',  icon:'⚡', label:'Generator Mechanic',      keywords:['generator','gen','mikano','lister','perkins','diesel','petrol'] },
  { id:'deep_cleaning',       icon:'🧼', label:'Deep Cleaning',           keywords:['clean','fumigat','wash','scrub','post construction','disinfect'] },
  { id:'borehole_plumbing',   icon:'🚰', label:'Borehole & Plumbing',     keywords:['plumb','pipe','borehole','water','tap','drain','toilet','pump','leak'] },
  { id:'smart_home_cctv',     icon:'👨‍💻', label:'Smart Home & CCTV',       keywords:['cctv','camera','smart home','fibre','network','wifi','security'] },
  { id:'vehicle_diagnostics', icon:'🚗', label:'Vehicle Diagnostics',     keywords:['car','vehicle','mechanic','engine','brake','tyre','ecu','diagnostic'] },
  { id:'elite_barber_hair',   icon:'💈', label:'Barber & Hair Pro',        keywords:['barb','haircut','cut','fade','weave','braid','locs','hair'] },
  { id:'luxury_nail_spa',     icon:'💅', label:'Nail & Spa',              keywords:['nail','manicure','pedicure','gel','acrylic','spa','lash'] },
  { id:'secured_logistics',   icon:'📦', label:'Logistics & Courier',     keywords:['deliver','dispatch','courier','rider','pickup','dropoff','send'] },
];

const URGENCY = [
  { key:'now',      label:'⚡ Now',      desc:'Provider arrives within the hour' },
  { key:'today',    label:'📅 Today',    desc:'Arrives same day' },
  { key:'flexible', label:'🗓 Flexible', desc:'Schedule at your convenience' },
];

function detectCategory(title: string): string | null {
  const t = title.toLowerCase();
  let best: { id: string; score: number } | null = null;
  for (const cat of CATEGORIES) {
    const matches = cat.keywords.filter(k => t.includes(k)).length;
    if (matches > 0 && (!best || matches > best.score))
      best = { id: cat.id, score: matches };
  }
  return best?.id || null;
}

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('borehole_plumbing');
  const [urgency, setUrgency] = useState('today');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [locArea, setLocArea] = useState('Lagos, Nigeria');
  const [mismatch, setMismatch] = useState<string | null>(null);
  const [autoSuggest, setAutoSuggest] = useState<string | null>(null);

  const priceConfig = CATEGORY_PRICE_CONFIG[category] || { floor: 3000, ceiling: 500000 };
  const selectedCat = CATEGORIES.find(c => c.id === category)!;

  const handleTitleChange = (text: string) => {
    if (text.length > 500) return;
    setTitle(text);
    if (text.length > 15) {
      const detected = detectCategory(text);
      if (detected && detected !== category) {
        setAutoSuggest(detected);
        const det = CATEGORIES.find(c => c.id === detected);
        setMismatch(`Sounds like "${det?.label}" — did you mean that?`);
      } else {
        setAutoSuggest(null); setMismatch(null);
      }
    } else {
      setAutoSuggest(null); setMismatch(null);
    }
  };

  const handlePost = async () => {
    if (!title.trim() || title.trim().length < 10) {
      Alert.alert('Too short', 'Describe your request in at least 10 characters'); return;
    }
    const min = parseInt(budgetMin) || 0;
    const max = parseInt(budgetMax) || 0;
    if (budgetMin && min < priceConfig.floor) {
      Alert.alert('Budget too low',
        `Minimum for ${selectedCat.label} is ₦${priceConfig.floor.toLocaleString()}`); return;
    }
    if (budgetMin && budgetMax && min > max) {
      Alert.alert('Invalid budget', 'Minimum cannot exceed maximum'); return;
    }
    setLoading(true);
    try {
      let lat = 6.5244, lng = 3.3792, area = 'Lagos';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise((_,rej) => setTimeout(() => rej(new Error('t')), 5000))
          ]) as any;
          lat = loc.coords.latitude; lng = loc.coords.longitude;
          const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (geo.length > 0) { area = geo[0].district || geo[0].city || 'Lagos'; setLocArea(`${area}, Nigeria`); }
        }
      } catch {}
      const phone = await AsyncStorage.getItem('userPhone');
      const expiresAt = new Date(Date.now() + getExpiryHours(category, urgency) * 3600000);
      await addDoc(collection(db, 'requests'), {
        title: title.trim(), category, urgency,
        budgetMin: min || priceConfig.floor,
        budgetMax: max || priceConfig.ceiling,
        status: 'open', responseCount: 0,
        location: { lat, lng, area },
        customerId: phone || 'unknown',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        isSeeded: false,
      });
      setPosted(true);
    } catch {
      Alert.alert('Error', 'Could not post. Check your connection.');
    } finally { setLoading(false); }
  };

  if (posted) return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top, alignItems:'center', justifyContent:'center', padding:30 }}>
      <Text style={{ fontSize:52, marginBottom:16 }}>✅</Text>
      <Text style={{ fontSize:22, fontWeight:'800', color:theme.text, marginBottom:8 }}>Request Posted!</Text>
      <Text style={{ fontSize:14, color:theme.text3, textAlign:'center', marginBottom:28, lineHeight:22 }}>
        Nearby verified specialists will respond shortly.
      </Text>
      <TouchableOpacity
        style={{ backgroundColor:theme.brand, borderRadius:12, padding:16, paddingHorizontal:28 }}
        onPress={() => { setPosted(false); setTitle(''); router.replace('/(tabs)/'); }}>
        <Text style={{ color:'#fff', fontSize:15, fontWeight:'700' }}>View My Requests →</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Post a Request</Text>
        <View style={{ width:50 }}/>
      </View>

      <ScrollView contentContainerStyle={{ padding:16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Description */}
        <Text style={{ fontSize:11, color:theme.text3, marginBottom:8, marginTop:4, textTransform:'uppercase', letterSpacing:0.7 }}>Describe what you need</Text>
        <TextInput
          style={{ backgroundColor:theme.inputBg, borderRadius:12, padding:14, fontSize:14, color:theme.text, borderWidth:0.5, borderColor:theme.border, minHeight:100, textAlignVertical:'top', lineHeight:22 }}
          placeholder="Be specific — the more detail you give, the better your offers will be..."
          placeholderTextColor={theme.text3}
          value={title} onChangeText={handleTitleChange} multiline numberOfLines={4}
        />
        <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:4 }}>
          <Text style={{ fontSize:11, color:theme.text3 }}>{title.length < 10 ? `${10 - title.length} more characters needed` : ''}</Text>
          <Text style={{ fontSize:11, color:theme.text3 }}>{title.length}/500</Text>
        </View>

        {/* Mismatch warning */}
        {mismatch && (
          <View style={{ backgroundColor:theme.amber+'18', borderRadius:10, padding:12, marginTop:8, borderWidth:0.5, borderColor:theme.amber }}>
            <Text style={{ fontSize:12, color:theme.amber, marginBottom:8 }}>⚠️ {mismatch}</Text>
            {autoSuggest && (
              <TouchableOpacity
                style={{ backgroundColor:theme.amber, borderRadius:8, padding:8, alignItems:'center' }}
                onPress={() => { setCategory(autoSuggest!); setAutoSuggest(null); setMismatch(null); }}>
                <Text style={{ fontSize:12, color:'#fff', fontWeight:'700' }}>
                  Switch to {CATEGORIES.find(c => c.id === autoSuggest)?.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Categories */}
        <Text style={{ fontSize:11, color:theme.text3, marginBottom:10, marginTop:18, textTransform:'uppercase', letterSpacing:0.7 }}>Service Category</Text>
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.id}
              style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:9, borderRadius:20, backgroundColor: category === c.id ? theme.brand+'15' : theme.card, borderWidth:0.5, borderColor: category === c.id ? theme.brand : theme.border }}
              onPress={() => { setCategory(c.id); setAutoSuggest(null); setMismatch(null); }}>
              <Text style={{ fontSize:14 }}>{c.icon}</Text>
              <Text style={{ fontSize:12, color: category === c.id ? theme.brand : theme.text3, fontWeight: category === c.id ? '700' : '400' }}>{c.label}</Text>
              {category === c.id && <Text style={{ fontSize:10, color:theme.brand }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Price guide for selected category */}
        <View style={{ backgroundColor:theme.brand+'10', borderRadius:10, padding:10, marginTop:10, borderWidth:0.5, borderColor:theme.brand+'30' }}>
          <Text style={{ fontSize:11, color:theme.brand, fontWeight:'600' }}>
            {selectedCat.icon} {selectedCat.label} · Typical range: ₦{priceConfig.floor.toLocaleString()} – ₦{priceConfig.ceiling.toLocaleString()}
          </Text>
        </View>

        {/* Urgency */}
        <Text style={{ fontSize:11, color:theme.text3, marginBottom:8, marginTop:18, textTransform:'uppercase', letterSpacing:0.7 }}>Urgency</Text>
        <View style={{ flexDirection:'row', gap:8 }}>
          {URGENCY.map(u => (
            <TouchableOpacity key={u.key}
              style={{ flex:1, padding:11, borderRadius:10, borderWidth:0.5, borderColor: urgency === u.key ? theme.brand : theme.border, backgroundColor: urgency === u.key ? theme.brand+'15' : theme.card, alignItems:'center' }}
              onPress={() => setUrgency(u.key)}>
              <Text style={{ fontSize:12, color: urgency === u.key ? theme.brand : theme.text3, fontWeight:'600' }}>{u.label}</Text>
              <Text style={{ fontSize:10, color:theme.text3, marginTop:3, textAlign:'center' }}>{u.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Budget */}
        <Text style={{ fontSize:11, color:theme.text3, marginBottom:8, marginTop:18, textTransform:'uppercase', letterSpacing:0.7 }}>Budget (optional)</Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <View style={{ flex:1, flexDirection:'row', alignItems:'center', backgroundColor:theme.inputBg, borderRadius:10, borderWidth:0.5, borderColor:theme.border, paddingHorizontal:12 }}>
            <Text style={{ fontSize:15, color:theme.brand, fontWeight:'700', marginRight:4 }}>₦</Text>
            <TextInput style={{ flex:1, padding:11, fontSize:14, color:theme.text }}
              placeholder={`Min ₦${priceConfig.floor.toLocaleString()}`}
              placeholderTextColor={theme.text3}
              keyboardType="number-pad" value={budgetMin} onChangeText={setBudgetMin}/>
          </View>
          <Text style={{ color:theme.text3, fontSize:14 }}>to</Text>
          <View style={{ flex:1, flexDirection:'row', alignItems:'center', backgroundColor:theme.inputBg, borderRadius:10, borderWidth:0.5, borderColor:theme.border, paddingHorizontal:12 }}>
            <Text style={{ fontSize:15, color:theme.brand, fontWeight:'700', marginRight:4 }}>₦</Text>
            <TextInput style={{ flex:1, padding:11, fontSize:14, color:theme.text }}
              placeholder="Maximum"
              placeholderTextColor={theme.text3}
              keyboardType="number-pad" value={budgetMax} onChangeText={setBudgetMax}/>
          </View>
        </View>
        {budgetMin && parseInt(budgetMin) < priceConfig.floor && parseInt(budgetMin) > 0 && (
          <Text style={{ fontSize:11, color:theme.red, marginTop:4 }}>
            Minimum for this category is ₦{priceConfig.floor.toLocaleString()}
          </Text>
        )}

        {/* Location */}
        <Text style={{ fontSize:11, color:theme.text3, marginBottom:8, marginTop:18, textTransform:'uppercase', letterSpacing:0.7 }}>Your Location</Text>
        <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:theme.card, borderRadius:10, padding:13, borderWidth:0.5, borderColor:theme.border }}>
          <Text style={{ fontSize:16 }}>📍</Text>
          <Text style={{ fontSize:13, color:theme.text3, flex:1, marginLeft:8 }}>{locArea} · Auto-detected</Text>
          <Text style={{ fontSize:12, color:theme.green }}>✓</Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor:theme.brand, borderRadius:12, padding:16, alignItems:'center', marginTop:24, opacity: loading || title.trim().length < 10 ? 0.5 : 1 }}
          onPress={handlePost}
          disabled={loading || title.trim().length < 10}>
          {loading
            ? <ActivityIndicator color="#fff"/>
            : <Text style={{ color:'#fff', fontSize:15, fontWeight:'700' }}>Post Request →</Text>}
        </TouchableOpacity>
        <Text style={{ fontSize:11, color:theme.text3, textAlign:'center', marginTop:12 }}>
          Visible to nearby verified specialists only.
        </Text>
        <View style={{ height:40 }}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
