import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const KEYS = ['newMessages','newOffers','jobAccepted','jobCompleted','reviews','nearbyJobs','promotions'];
const DEFAULTS: Record<string,boolean> = { newMessages:true, newOffers:true, jobAccepted:true, jobCompleted:true, reviews:true, nearbyJobs:true, promotions:false };

export default function NotificationsSettings() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    const load = async () => {
      const stored = { ...DEFAULTS };
      for (const key of KEYS) {
        const val = await AsyncStorage.getItem(`notif_${key}`);
        if (val !== null) stored[key] = val === 'true';
      }
      setSettings(stored);
    };
    load();
  }, []);

  const toggle = async (key: string) => {
    const next = !settings[key];
    setSettings(prev => ({ ...prev, [key]: next }));
    await AsyncStorage.setItem(`notif_${key}`, String(next));
  };

  const items = [
    {key:'newMessages',  label:'New Messages',   sub:'When someone sends you a message'},
    {key:'newOffers',    label:'New Offers',      sub:'When a provider sends you an offer'},
    {key:'jobAccepted',  label:'Job Accepted',    sub:'When your offer is accepted'},
    {key:'jobCompleted', label:'Job Completed',   sub:'When a job is marked complete'},
    {key:'reviews',      label:'New Reviews',     sub:'When you receive a review'},
    {key:'nearbyJobs',   label:'Nearby Jobs',     sub:'New jobs posted in your area'},
    {key:'promotions',   label:'Promotions',      sub:'Special offers and discounts'},
  ];

  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Notifications</Text>
        <View style={{ width:50 }}/>
      </View>
      <ScrollView contentContainerStyle={{ padding:16 }}>
        <View style={{ backgroundColor:theme.card, borderRadius:14, borderWidth:0.5, borderColor:theme.border, overflow:'hidden', marginBottom:14 }}>
          <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, padding:14, paddingBottom:8 }}>Push Notifications</Text>
          {items.map((item,i)=>(
            <View key={item.key} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:14, borderBottomWidth:i===items.length-1?0:0.5, borderBottomColor:theme.border }}>
              <View style={{ flex:1, marginRight:12 }}>
                <Text style={{ fontSize:14, color:theme.text, fontWeight:'500' }}>{item.label}</Text>
                <Text style={{ fontSize:11, color:theme.text3, marginTop:2 }}>{item.sub}</Text>
              </View>
              <Switch value={settings[item.key]} onValueChange={()=>toggle(item.key)} trackColor={{false:theme.border,true:theme.brand}} thumbColor="#fff"/>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
