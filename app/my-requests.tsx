import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const STATUS_COLOR: Record<string, string> = { open: '#F59E0B', in_progress: '#FF5C00', completed: '#2ECC71', expired: '#555' };
const STATUS_LABEL: Record<string, string> = { open: '📋 Open', in_progress: '⚡ In Progress', completed: '✓ Completed', expired: '⏱ Expired' };

export default function MyRequests() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const phone = await AsyncStorage.getItem('userPhone') || '';
      if (!phone) { setLoading(false); return; }
      const q = query(collection(db, 'requests'), where('customerId', '==', phone), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q,
        snap => { setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
        () => setLoading(false)
      );
      return unsub;
    };
    init();
  }, []);

  return (
    <View style={[s.safe, { paddingTop: insets.top, backgroundColor: theme.bg , backgroundColor: theme.bg}]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>My Requests</Text>
        <TouchableOpacity onPress={() => router.push('/post')}>
          <Text style={{ color: '#FF5C00', fontSize: 13, fontWeight: '700' }}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#FF5C00" size="large" /></View>
      ) : requests.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 44, marginBottom: 14 }}>📋</Text>
          <Text style={s.emptyTitle}>No requests yet</Text>
          <Text style={s.emptySub}>Post your first request and get offers from nearby verified providers in minutes.</Text>
          <TouchableOpacity style={s.postBtn} onPress={() => router.push('/post')}>
            <Text style={s.postBtnTxt}>Post a Request →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.cat}>{item.category}</Text>
                <Text style={[s.status, { color: STATUS_COLOR[item.status] || '#888' }]}>
                  {STATUS_LABEL[item.status] || item.status}
                </Text>
              </View>
              <Text style={s.cardTitle}>{item.title}</Text>
              <View style={s.cardBottom}>
                <Text style={s.metaTxt}>📍 {item.location?.area || 'Lagos'}</Text>
                {item.budgetMin > 0 && <Text style={s.metaTxt}>· ₦{item.budgetMin?.toLocaleString()}</Text>}
                <Text style={[s.metaTxt, { marginLeft: 'auto' as any }]}>
                  {(item.responseCount || 0)} offer{item.responseCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#0F0F14'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:0.5,borderBottomColor:'#2A2A38'},
  back:{color:'#FF5C00',fontSize:15},
  title:{fontSize:17,fontWeight:'700',color:'#FFFFFF'},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:32},
  emptyTitle:{fontSize:18,fontWeight:'700',color:'#FFFFFF',marginBottom:8},
  emptySub:{fontSize:14,color:'#666',textAlign:'center',lineHeight:22,marginBottom:24},
  postBtn:{backgroundColor:'#FF5C00',borderRadius:12,paddingHorizontal:24,paddingVertical:13},
  postBtnTxt:{color:'#fff',fontSize:14,fontWeight:'700'},
  list:{padding:16},
  card:{backgroundColor:'#1A1A22',borderRadius:12,padding:14,marginBottom:10,borderWidth:0.5,borderColor:'#2A2A38'},
  cardTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:8},
  cat:{fontSize:11,color:'#FF5C00',fontWeight:'700',textTransform:'uppercase'},
  status:{fontSize:11,fontWeight:'600'},
  cardTitle:{fontSize:15,color:'#FFFFFF',fontWeight:'600',marginBottom:8,lineHeight:21},
  cardBottom:{flexDirection:'row',alignItems:'center',gap:6},
  metaTxt:{fontSize:12,color:'#666'},
});
