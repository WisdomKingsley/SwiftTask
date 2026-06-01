import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

function getInitials(name: string): string {
  const p = name.trim().split(' ').filter(Boolean);
  if (!p.length) return '?';
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase();
}

export default function ProviderProfile() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [jobsDone, setJobsDone] = useState(0);
  const [rating, setRating] = useState(0);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      const name = await AsyncStorage.getItem('userName') || '';
      const phone = await AsyncStorage.getItem('userPhone') || '';
      setUserName(name); setUserPhone(phone);
      if (phone) {
        try {
          const snap = await getDoc(doc(db, 'users', phone));
          if (snap.exists()) {
            const d = snap.data();
            setSkills(d.providerProfile?.skills || []);
            setJobsDone(d.stats?.jobsCompleted || 0);
            setRating(d.stats?.rating || 0);
            setIsOnline(d.isOnline || false);
          }
        } catch {}
      }
    };
    load();
  }, []));

  const handleLogout = () => Alert.alert('Log out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: async () => {
      await AsyncStorage.multiRemove(['userRole','userPhone','userName']);
      router.replace('/login');
    }},
  ]);

  const initials = getInitials(userName || 'P');

  const MenuItem = ({ icon, label, sub, route }: any) => (
    <TouchableOpacity
      style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14, borderBottomWidth:0.5, borderBottomColor:theme.border }}
      onPress={() => router.push(route)}>
      <View style={{ width:38, height:38, borderRadius:10, backgroundColor:theme.bg3, alignItems:'center', justifyContent:'center' }}>
        <Text style={{ fontSize:18 }}>{icon}</Text>
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontSize:14, color:theme.text, fontWeight:'500' }}>{label}</Text>
        <Text style={{ fontSize:11, color:theme.text3, marginTop:2 }}>{sub}</Text>
      </View>
      <Text style={{ fontSize:20, color:theme.text3 }}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Provider Profile</Text>
        <TouchableOpacity onPress={() => router.push('/edit-provider-profile')}><Text style={{ color:theme.brand, fontSize:15 }}>Edit</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <TouchableOpacity style={{ alignItems:'center', paddingVertical:28 }} onPress={() => router.push('/edit-provider-profile')}>
          <View style={{ position:'relative', marginBottom:12 }}>
            <View style={{ width:88, height:88, borderRadius:44, backgroundColor:theme.brand+'25', alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:32, fontWeight:'800', color:theme.brand }}>{initials}</Text>
            </View>
            <View style={{ position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor:theme.brand, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:theme.bg }}>
              <Text style={{ fontSize:13 }}>📷</Text>
            </View>
          </View>
          <Text style={{ fontSize:22, fontWeight:'700', color:theme.text, marginBottom:4 }}>{userName || 'Complete your profile'}</Text>
          <Text style={{ fontSize:13, color:theme.text3, marginBottom:10 }}>Service Provider · Lagos, Nigeria</Text>
          <View style={{ flexDirection:'row', gap:8 }}>
            <View style={{ backgroundColor:theme.green+'20', paddingHorizontal:12, paddingVertical:5, borderRadius:20, borderWidth:0.5, borderColor:theme.green+'40' }}>
              <Text style={{ fontSize:12, color:theme.green, fontWeight:'600' }}>✅ Verified</Text>
            </View>
            {jobsDone < 5 && (
              <View style={{ backgroundColor:theme.brand+'15', paddingHorizontal:12, paddingVertical:5, borderRadius:20, borderWidth:0.5, borderColor:theme.brand+'30' }}>
                <Text style={{ fontSize:12, color:theme.brand, fontWeight:'600' }}>✨ New Provider</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Stats — same style as customer profile */}
        <View style={{ flexDirection:'row', gap:8, paddingHorizontal:16, marginBottom:14 }}>
          {[
            { num: String(jobsDone), label: 'Jobs Done' },
            { num: rating > 0 ? rating.toFixed(1) + '★' : '—', label: 'Rating' },
            { num: '—', label: 'Response' },
            { num: jobsDone > 0 ? '100%' : '—', label: 'Completion' },
          ].map((st, i) => (
            <View key={i} style={{ flex:1, backgroundColor:theme.card, borderRadius:12, padding:10, alignItems:'center', borderWidth:0.5, borderColor:theme.border }}>
              <Text style={{ fontSize:16, fontWeight:'800', color:theme.text }}>{st.num}</Text>
              <Text style={{ fontSize:9, color:theme.text3, marginTop:3, textAlign:'center' }}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Earnings */}
        <View style={{ backgroundColor:theme.brand+'12', marginHorizontal:16, marginBottom:14, borderRadius:14, padding:16, borderWidth:0.5, borderColor:theme.brand+'30' }}>
          <Text style={{ fontSize:12, color:theme.brand, fontWeight:'600', marginBottom:6 }}>💰 Total Earnings</Text>
          <Text style={{ fontSize:28, fontWeight:'800', color:theme.text, marginBottom:6 }}>₦0</Text>
          <Text style={{ fontSize:11, color:theme.text3, lineHeight:16 }}>Complete jobs to start earning. SwiftTask takes 10% commission on each job.</Text>
        </View>

        {/* Availability + Skills */}
        <View style={{ backgroundColor:theme.card, borderRadius:14, marginHorizontal:16, marginBottom:14, padding:14, borderWidth:0.5, borderColor:theme.border }}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <View>
              <Text style={{ fontSize:15, fontWeight:'600', color:theme.text }}>Available for jobs</Text>
              <Text style={{ fontSize:11, marginTop:3, color: isOnline ? theme.green : theme.text3 }}>
                {isOnline ? '● Visible to customers' : '○ Hidden from feed'}
              </Text>
            </View>
            <Switch value={isOnline} onValueChange={setIsOnline} trackColor={{ false:theme.border, true:theme.brand }} thumbColor="#fff" />
          </View>
          <View style={{ height:0.5, backgroundColor:theme.border, marginBottom:12 }}/>
          <Text style={{ fontSize:12, color:theme.text3, marginBottom:10 }}>Your Skills</Text>
          {skills.length === 0 ? (
            <TouchableOpacity onPress={() => router.push('/edit-provider-profile')}>
              <Text style={{ fontSize:13, color:theme.brand }}>+ Add your skills to get matched with jobs</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
              {skills.map(sk => (
                <View key={sk} style={{ backgroundColor:theme.brand+'15', paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:0.5, borderColor:theme.brand+'30' }}>
                  <Text style={{ fontSize:12, color:theme.brand }}>{sk}</Text>
                </View>
              ))}
              <TouchableOpacity style={{ backgroundColor:theme.bg3, paddingHorizontal:12, paddingVertical:6, borderRadius:20 }} onPress={() => router.push('/edit-provider-profile')}>
                <Text style={{ fontSize:12, color:theme.text3 }}>+ Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Work History */}
        <View style={{ backgroundColor:theme.card, borderRadius:14, marginHorizontal:16, marginBottom:14, borderWidth:0.5, borderColor:theme.border, overflow:'hidden' }}>
          <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, padding:14, paddingBottom:6 }}>Work History</Text>
          {[
            {icon:'💼',label:'My Jobs',sub:"All jobs you've completed",route:'/my-jobs'},
            {icon:'⭐',label:'My Reviews',sub:'See what customers say',route:'/reviews'},
            {icon:'💬',label:'Messages',sub:'Chat with customers',route:'/chat'},
            {icon:'📊',label:'Performance',sub:'Your stats and analytics',route:'/performance'},
          ].map((item, i, arr) => (
            <View key={i} style={{ borderBottomWidth: i===arr.length-1?0:0.5, borderBottomColor:theme.border }}>
              <MenuItem {...item} />
            </View>
          ))}
        </View>

        {/* Account */}
        <View style={{ backgroundColor:theme.card, borderRadius:14, marginHorizontal:16, marginBottom:14, borderWidth:0.5, borderColor:theme.border, overflow:'hidden' }}>
          <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, padding:14, paddingBottom:6 }}>Preferences</Text>
          {[
            {icon:'🎨',label:'Appearance',sub:'Dark and light mode',route:'/appearance'},
            {icon:'🔔',label:'Notifications',sub:'Job alerts and messages',route:'/notifications-settings'},
            {icon:'💳',label:'Payment Settings',sub:'Bank account & payouts',route:'/payment-settings'},
            {icon:'🛡️',label:'Privacy & Safety',sub:'Control your data',route:'/privacy-settings'},
            {icon:'🎁',label:'Refer & Earn',sub:'Invite providers, earn ₦500',route:'/refer-earn'},
            {icon:'❓',label:'Help & Support',sub:'Get help from our team',route:'/help-support'},
          ].map((item, i, arr) => (
            <View key={i} style={{ borderBottomWidth: i===arr.length-1?0:0.5, borderBottomColor:theme.border }}>
              <MenuItem {...item} />
            </View>
          ))}
        </View>

        {/* Referral */}
        <View style={{ backgroundColor:theme.card, borderRadius:14, marginHorizontal:16, marginBottom:14, padding:16, borderWidth:0.5, borderColor:theme.brand+'40' }}>
          <Text style={{ fontSize:14, fontWeight:'700', color:theme.brand, marginBottom:6 }}>🎉 Refer a provider — earn ₦500</Text>
          <Text style={{ fontSize:12, color:theme.text3, marginBottom:14, lineHeight:18 }}>Know someone who wants to earn? Invite them and both get rewarded.</Text>
          <TouchableOpacity style={{ backgroundColor:theme.brand, borderRadius:10, padding:13, alignItems:'center' }} onPress={() => Alert.alert('Copied!', `swifttask.ng/ref/${userPhone.slice(-6)} copied!`)}>
            <Text style={{ color:'#fff', fontSize:13, fontWeight:'700' }}>Copy Referral Link 📋</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{ marginHorizontal:16, backgroundColor:theme.card, borderRadius:12, padding:15, alignItems:'center', borderWidth:0.5, borderColor:theme.border, marginBottom:10 }} onPress={handleLogout}>
          <Text style={{ color:theme.red, fontSize:15, fontWeight:'600' }}>Log out</Text>
        </TouchableOpacity>
        <View style={{ height:40 }} />
      </ScrollView>
    </View>
  );
}
