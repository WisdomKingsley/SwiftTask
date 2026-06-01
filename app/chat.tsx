import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rtdb } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#FF5C00','#7F77DD','#2ECC71','#F59E0B','#E74C3C'];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [chats, setChats] = useState<any[]>([]);
  const [myPhone, setMyPhone] = useState('');

  useEffect(() => {
    const init = async () => {
      const phone = await AsyncStorage.getItem('userPhone') || '';
      setMyPhone(phone);
      if (!phone) return;
      const msgsRef = ref(rtdb, 'messages');
      onValue(msgsRef, snap => {
        const data = snap.val();
        if (!data) { setChats([]); return; }
        const userChats: any[] = [];
        Object.entries(data).forEach(([chatId, messages]: [string, any]) => {
          const cleanPhone = phone.replace('+','').replace(/ /g,'');
          if (!chatId.includes(cleanPhone)) return;
          const msgList = Object.values(messages as any).sort((a:any,b:any) => b.createdAt - a.createdAt);
          const last: any = msgList[0];
          const otherName = chatId.replace(`chat_${phone}_`,'').replace(`_${phone}`,'') || 'Provider';
          const initials = otherName.slice(0,2).toUpperCase();
          const color = COLORS[otherName.length % COLORS.length];
          userChats.push({
            id: chatId, name: otherName.replace(/_/g,' ') || 'Provider',
            initials, color,
            lastMsg: last?.text || 'No messages yet',
            lastTime: last?.createdAt ? new Date(last.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '',
            unread: (msgList as any[]).filter((m:any) => m.from !== phone && !m.read).length,
          });
        });
        setChats(userChats.sort((a,b) => b.lastTime.localeCompare(a.lastTime)));
      });
    };
    init();
  }, []);

  return (
    <View style={{flex:1, backgroundColor:theme.bg, paddingTop:insets.top}}>
      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border}}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{color:theme.brand, fontSize:15}}>← Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize:17, fontWeight:'700', color:theme.text}}>Messages</Text>
        <View style={{width:50}}/>
      </View>

      {chats.length === 0 ? (
        <View style={{flex:1, alignItems:'center', justifyContent:'center', padding:32}}>
          <Text style={{fontSize:44, marginBottom:14}}>💬</Text>
          <Text style={{fontSize:18, fontWeight:'700', color:theme.text, marginBottom:8}}>No conversations yet</Text>
          <Text style={{fontSize:14, color:theme.text3, textAlign:'center', lineHeight:21}}>
            When you chat with a provider or customer, the conversation will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding:16}}
          renderItem={({item}) => (
            <TouchableOpacity
              style={{flexDirection:'row', alignItems:'center', gap:12, paddingVertical:14, borderBottomWidth:0.5, borderBottomColor:theme.border}}
              onPress={() => router.push({pathname:'/chatroom', params:{name:item.name, initials:item.initials, color:item.color, chatId:item.id}})}>
              <View style={{width:48, height:48, borderRadius:24, backgroundColor:item.color+'25', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <Text style={{fontSize:16, fontWeight:'700', color:item.color}}>{item.initials}</Text>
              </View>
              <View style={{flex:1}}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                  <Text style={{fontSize:15, fontWeight:'600', color:theme.text}}>{item.name}</Text>
                  <Text style={{fontSize:11, color:theme.text3}}>{item.lastTime}</Text>
                </View>
                <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                  <Text style={{fontSize:13, color:theme.text3, flex:1}} numberOfLines={1}>{item.lastMsg}</Text>
                  {item.unread > 0 && (
                    <View style={{backgroundColor:theme.brand, borderRadius:10, paddingHorizontal:6, paddingVertical:2, minWidth:18, alignItems:'center'}}>
                      <Text style={{fontSize:10, color:'#fff', fontWeight:'700'}}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
