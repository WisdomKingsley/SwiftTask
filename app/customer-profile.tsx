import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

export default function CustomerProfile() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [jobsPosted, setJobsPosted] = useState(0);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      const name = await AsyncStorage.getItem('userName') || '';
      const phone = await AsyncStorage.getItem('userPhone') || '';
      setUserName(name); setUserPhone(phone);
      if (phone) {
        try {
          const snap = await getDoc(doc(db, 'users', phone));
          if (snap.exists()) setJobsPosted(snap.data().stats?.jobsPosted || 0);
        } catch {}
      }
    };
    load();
  }, []));

  const handleLogout = () => Alert.alert('Log out','Are you sure?',[
    {text:'Cancel',style:'cancel'},
    {text:'Log out',style:'destructive',onPress:async()=>{
      await AsyncStorage.multiRemove(['userRole','userPhone','userName']);
      router.replace('/login');
    }},
  ]);

  const initials = getInitials(userName || 'U');

  const menuSections = [
    { title: 'My Activity', items: [
      {icon:'📋',label:'My Requests',sub:'View and manage your posted jobs',route:'/my-requests'},
      {icon:'⭐',label:'My Reviews',sub:'Reviews you have given providers',route:'/reviews'},
      {icon:'💬',label:'Messages',sub:'Chat with providers',route:'/chat'},
    ]},
    { title: 'Preferences', items: [
      {icon:'🎨',label:'Appearance',sub:'Dark and light mode',route:'/appearance'},
      {icon:'🔔',label:'Notifications',sub:'Manage your alerts',route:'/notifications-settings'},
      {icon:'🛡️',label:'Privacy & Safety',sub:'Control your data',route:'/privacy-settings'},
    ]},
    { title: 'Account', items: [
      {icon:'💳',label:'Payment & Wallet',sub:'Add funds and payment methods',route:'/payment-settings'},
      {icon:'🎁',label:'Refer & Earn',sub:'Invite friends, earn ₦500 each',route:'/refer-earn'},
      {icon:'❓',label:'Help & Support',sub:'Get help from our team',route:'/help-support'},
    ]},
  ];

  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>My Profile</Text>
        <TouchableOpacity onPress={()=>router.push('/edit-profile')}><Text style={{ color:theme.brand, fontSize:15 }}>Edit</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <TouchableOpacity style={{ alignItems:'center', paddingVertical:28 }} onPress={()=>router.push('/edit-profile')}>
          <View style={{ position:'relative', marginBottom:12 }}>
            <View style={{ width:88, height:88, borderRadius:44, backgroundColor:theme.brand+'25', alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:32, fontWeight:'800', color:theme.brand }}>{initials}</Text>
            </View>
            <View style={{ position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor:theme.brand, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:theme.bg }}>
              <Text style={{ fontSize:13 }}>📷</Text>
            </View>
          </View>
          <Text style={{ fontSize:22, fontWeight:'700', color:theme.text, marginBottom:4 }}>{userName||'Complete your profile'}</Text>
          <Text style={{ fontSize:13, color:theme.text3, marginBottom:10 }}>Customer · Lagos, Nigeria</Text>
          <View style={{ backgroundColor:theme.green+'20', paddingHorizontal:12, paddingVertical:5, borderRadius:20 }}>
            <Text style={{ fontSize:12, color:theme.green, fontWeight:'600' }}>✓ Phone Verified</Text>
          </View>
        </TouchableOpacity>

        {/* Stats */}
        <View style={{ flexDirection:'row', gap:10, paddingHorizontal:16, marginBottom:16 }}>
          {[{num:String(jobsPosted),label:'Jobs Posted'},{num:'0',label:'Completed'},{num:'₦0',label:'Wallet'}].map((st,i)=>(
            <View key={i} style={{ flex:1, backgroundColor:theme.card, borderRadius:12, padding:14, alignItems:'center', borderWidth:0.5, borderColor:theme.border }}>
              <Text style={{ fontSize:20, fontWeight:'800', color:theme.text }}>{st.num}</Text>
              <Text style={{ fontSize:10, color:theme.text3, marginTop:3 }}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        {menuSections.map((section,si)=>(
          <View key={si} style={{ backgroundColor:theme.card, borderRadius:14, marginHorizontal:16, marginBottom:14, borderWidth:0.5, borderColor:theme.border, overflow:'hidden' }}>
            <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, padding:14, paddingBottom:6 }}>{section.title}</Text>
            {section.items.map((item,i,arr)=>(
              <TouchableOpacity key={i} style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14, borderBottomWidth: i===arr.length-1?0:0.5, borderBottomColor:theme.border }} onPress={()=>router.push(item.route as any)}>
                <View style={{ width:38, height:38, borderRadius:10, backgroundColor:theme.bg3, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ fontSize:18 }}>{item.icon}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:14, color:theme.text, fontWeight:'500' }}>{item.label}</Text>
                  <Text style={{ fontSize:11, color:theme.text3, marginTop:2 }}>{item.sub}</Text>
                </View>
                <Text style={{ fontSize:20, color:theme.text3 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Referral */}
        <View style={{ backgroundColor:theme.card, borderRadius:14, marginHorizontal:16, marginBottom:14, padding:16, borderWidth:0.5, borderColor:theme.brand+'50' }}>
          <Text style={{ fontSize:14, fontWeight:'700', color:theme.brand, marginBottom:6 }}>🎉 Refer friends — earn ₦500 each</Text>
          <Text style={{ fontSize:12, color:theme.text3, marginBottom:14, lineHeight:18 }}>Share your link. Both get rewarded when they complete their first job.</Text>
          <TouchableOpacity style={{ backgroundColor:theme.brand, borderRadius:10, padding:13, alignItems:'center' }} onPress={()=>Alert.alert('Copied!',`swifttask.ng/ref/${userPhone.slice(-6)} copied!`)}>
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
