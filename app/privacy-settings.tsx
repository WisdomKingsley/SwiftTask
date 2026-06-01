import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const KEYS = ['locationSharing','profileVisible','activityStatus','dataAnalytics'];
const DEFAULTS: Record<string,boolean> = { locationSharing:true, profileVisible:true, activityStatus:true, dataAnalytics:false };

export default function PrivacySettings() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    const load = async () => {
      const stored = { ...DEFAULTS };
      for (const key of KEYS) {
        const val = await AsyncStorage.getItem(`privacy_${key}`);
        if (val !== null) stored[key] = val === 'true';
      }
      setSettings(stored);
    };
    load();
  }, []);

  const toggle = async (key: string) => {
    const next = !settings[key];
    setSettings(prev => ({ ...prev, [key]: next }));
    await AsyncStorage.setItem(`privacy_${key}`, String(next));
  };

  const privacyItems = [
    {key:'locationSharing', label:'Share Location',       sub:'Allow SwiftTask to use your GPS'},
    {key:'profileVisible',  label:'Public Profile',       sub:'Let others see your profile'},
    {key:'activityStatus',  label:'Show Activity Status', sub:'Show when you were last active'},
    {key:'dataAnalytics',   label:'Analytics Data',       sub:'Help us improve the app'},
  ];

  const safetyItems = [
    {icon:'🚫', label:'Blocked Users',    sub:'Manage blocked accounts',  route:'/blocked-users'},
    {icon:'🚩', label:'Report a Problem', sub:'Flag suspicious activity', route:'/report-problem'},
    {icon:'📄', label:'Terms of Service', sub:'Read our terms',           route:'/terms-of-service'},
    {icon:'🔒', label:'Privacy Policy',   sub:'How we use your data',     route:'/privacy-policy'},
  ];

  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Privacy & Safety</Text>
        <View style={{ width:50 }}/>
      </View>
      <ScrollView contentContainerStyle={{ padding:16 }}>
        <View style={{ backgroundColor:theme.card, borderRadius:14, borderWidth:0.5, borderColor:theme.border, overflow:'hidden', marginBottom:14 }}>
          <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, padding:14, paddingBottom:8 }}>Privacy Controls</Text>
          {privacyItems.map((item,i)=>(
            <View key={item.key} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:14, borderBottomWidth:i===privacyItems.length-1?0:0.5, borderBottomColor:theme.border }}>
              <View style={{ flex:1, marginRight:12 }}>
                <Text style={{ fontSize:14, color:theme.text, fontWeight:'500' }}>{item.label}</Text>
                <Text style={{ fontSize:11, color:theme.text3, marginTop:2 }}>{item.sub}</Text>
              </View>
              <Switch value={settings[item.key]} onValueChange={()=>toggle(item.key)} trackColor={{false:theme.border,true:theme.brand}} thumbColor="#fff"/>
            </View>
          ))}
        </View>
        <View style={{ backgroundColor:theme.card, borderRadius:14, borderWidth:0.5, borderColor:theme.border, overflow:'hidden' }}>
          <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, padding:14, paddingBottom:8 }}>Safety</Text>
          {safetyItems.map((item,i)=>(
            <TouchableOpacity key={i} style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14, borderBottomWidth:i===safetyItems.length-1?0:0.5, borderBottomColor:theme.border }} onPress={()=>router.push(item.route as any)}>
              <View style={{ width:36, height:36, borderRadius:10, backgroundColor:theme.bg3, alignItems:'center', justifyContent:'center' }}>
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
      </ScrollView>
    </View>
  );
}
