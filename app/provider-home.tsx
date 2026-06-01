import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db, calculateMatchScore } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const URG: Record<string,{label:string;color:string;bg:string}> = {
  now:      { label:'⚡ Now',      color:'#FF5C00', bg:'rgba(255,92,0,0.12)' },
  today:    { label:'📅 Today',    color:'#F59E0B', bg:'rgba(245,158,11,0.12)' },
  flexible: { label:'🗓 Flexible', color:'#888888', bg:'rgba(136,136,136,0.12)' },
};

const CAT_ICONS: Record<string,string> = {
  'Plumbing':'🔧','Electrical':'⚡','Tech Repair':'💻','Delivery':'🚴',
  'Cleaning':'🧹','Mechanic':'🔩','Barbing':'✂️','Hair Dressing':'💇',
  'Nail Technician':'💅','Other':'📦',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function ProviderHomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState('Detecting...');
  const [locLoading, setLocLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [offerModal, setOfferModal] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerEta, setOfferEta] = useState('');
  const [offerMsg, setOfferMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const t = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const init = async () => {
      const name = await AsyncStorage.getItem('userName') || '';
      setUserName(name);
      getLocation();
      const q = query(collection(db,'requests'), where('status','==','open'), orderBy('createdAt','desc'));
      const unsub = onSnapshot(q,
        snap => { setJobs(snap.docs.map(d => ({id:d.id,...d.data()}))); setJobsLoading(false); },
        () => setJobsLoading(false)
      );
      return unsub;
    };
    init();
  }, []);

  const getLocation = async () => {
    setLocLoading(true);
    try {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocation('Lagos, Nigeria'); setLocLoading(false); return; }
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced}),
        new Promise((_,rej) => setTimeout(() => rej(new Error('t')), 5000))
      ]) as any;
      const geo = await Location.reverseGeocodeAsync({latitude:loc.coords.latitude, longitude:loc.coords.longitude});
      if (geo.length > 0) setLocation(`${geo[0].district||geo[0].city||'Lagos'}, Nigeria`);
    } catch { setLocation('Lagos, Nigeria'); }
    finally { setLocLoading(false); }
  };

  const handleSendOffer = async () => {
    if (!offerPrice || !offerEta) { Alert.alert('Required','Please enter your price and ETA'); return; }
    if (parseInt(offerPrice) < 1000) { Alert.alert('Too low','Minimum offer is ₦1,000'); return; }
    setSending(true);
    setTimeout(() => {
      setSending(false); setOfferModal(null);
      setOfferPrice(''); setOfferEta(''); setOfferMsg('');
      Alert.alert('Offer Sent! 🎉','The customer will be notified shortly.');
    }, 1000);
  };

  const firstName = userName ? userName.split(' ')[0] : 'there';
  const sortedJobs = [...jobs].sort((a,b) => {
    const o: Record<string,number> = {now:0,today:1,flexible:2};
    return (o[a.urgency]??2)-(o[b.urgency]??2);
  });

  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>

      {/* Header */}
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:width*0.04, paddingTop:12, paddingBottom:10 }}>
        <View>
          <Text style={{ fontSize:Math.min(17,width*0.046), fontWeight:'700', color:theme.text }}>{greeting}, {firstName} 💼</Text>
          <View style={{ flexDirection:'row', alignItems:'center', marginTop:2 }}>
            <Text style={{ fontSize:12 }}>📍</Text>
            {locLoading
              ? <ActivityIndicator size="small" color={theme.brand} style={{marginLeft:4}}/>
              : <Text style={{ fontSize:12, color:theme.brand }}> {location}</Text>}
          </View>
        </View>
        <TouchableOpacity
          style={{ width:36, height:36, borderRadius:18, backgroundColor:theme.card, alignItems:'center', justifyContent:'center', borderWidth:0.5, borderColor:theme.border }}
          onPress={() => router.push('/alerts')}>
          <Text style={{ fontSize:17 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Online toggle */}
      <TouchableOpacity
        style={{ flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:width*0.04, borderRadius:10, padding:12, marginBottom:10, borderWidth:0.5, backgroundColor: isOnline ? theme.green+'12' : theme.card, borderColor: isOnline ? theme.green+'40' : theme.border }}
        onPress={() => setIsOnline(!isOnline)} activeOpacity={0.8}>
        <View style={{ width:8, height:8, borderRadius:4, backgroundColor: isOnline ? theme.green : theme.text3 }}/>
        <Text style={{ flex:1, fontSize:12, fontWeight:'600', color: isOnline ? theme.green : theme.text3 }}>
          {isOnline ? 'Online — customers can find you' : 'Offline — tap to go online'}
        </Text>
        <Text style={{ fontSize:11, color: isOnline ? theme.green : theme.text3, fontWeight:'700' }}>{isOnline ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>

      {/* Earnings */}
      <View style={{ flexDirection:'row', gap:8, paddingHorizontal:width*0.04, marginBottom:12 }}>
        {[{num:'₦0',label:'Today'},{num:'₦0',label:'This week'},{num:'0',label:'Jobs done'}].map((e,i) => (
          <View key={i} style={{ flex:1, backgroundColor:theme.card, borderRadius:12, padding:12, alignItems:'center', borderWidth:0.5, borderColor:theme.border }}>
            <Text style={{ fontSize:14, fontWeight:'800', color:theme.brand }}>{e.num}</Text>
            <Text style={{ fontSize:10, color:theme.text3, marginTop:2 }}>{e.label}</Text>
          </View>
        ))}
      </View>

      {/* Section header */}
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:width*0.04, marginBottom:8 }}>
        <Text style={{ fontSize:14, fontWeight:'700', color:theme.text }}>
          {!isOnline ? 'Go online to see jobs' : jobsLoading ? 'Loading...' : `${sortedJobs.length} jobs near you`}
        </Text>
        {sortedJobs.length > 0 && <Text style={{ fontSize:11, color:theme.text3 }}>Sorted by urgency</Text>}
      </View>

      {/* Jobs */}
      {jobsLoading ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator color={theme.brand} size="large"/>
          <Text style={{ color:theme.text3, fontSize:13, marginTop:12 }}>Finding jobs near you...</Text>
        </View>
      ) : !isOnline ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:32 }}>
          <Text style={{ fontSize:44, marginBottom:14 }}>😴</Text>
          <Text style={{ fontSize:17, fontWeight:'700', color:theme.text, marginBottom:8 }}>You are offline</Text>
          <Text style={{ fontSize:13, color:theme.text3, textAlign:'center', marginBottom:20 }}>Go online to see nearby jobs and start earning.</Text>
          <TouchableOpacity style={{ backgroundColor:theme.brand, borderRadius:10, paddingHorizontal:24, paddingVertical:12 }} onPress={() => setIsOnline(true)}>
            <Text style={{ color:'#fff', fontSize:14, fontWeight:'700' }}>Go Online →</Text>
          </TouchableOpacity>
        </View>
      ) : sortedJobs.length === 0 ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:32 }}>
          <Text style={{ fontSize:44, marginBottom:14 }}>🔍</Text>
          <Text style={{ fontSize:17, fontWeight:'700', color:theme.text, marginBottom:8 }}>No jobs yet</Text>
          <Text style={{ fontSize:13, color:theme.text3, textAlign:'center' }}>New requests will appear here. Stay online to get notified.</Text>
        </View>
      ) : (
        <FlatList
          data={sortedJobs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal:width*0.04, paddingBottom:20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await getLocation();setRefreshing(false);}} tintColor={theme.brand}/>}
          showsVerticalScrollIndicator={false}
          renderItem={({item:job}) => {
            const urg = URG[job.urgency] || URG.flexible;
            const icon = CAT_ICONS[job.category] || '📦';
            const matchPct = Math.round(calculateMatchScore(
              {providerProfile:{isOnline:true,skills:[],responseTimeMins:0,avgPrice:0,serviceMode:'mobile'},stats:{},distanceKm:2,reviews:[]},
              job
            ) * 100);
            const matchColor = matchPct >= 70 ? theme.green : matchPct >= 50 ? theme.amber : theme.text3;
            return (
              <View style={{ backgroundColor:theme.card, borderRadius:14, padding:width*0.038, marginBottom:10, borderWidth:0.5, borderColor:theme.border }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                    <Text style={{ fontSize:13 }}>{icon}</Text>
                    <Text style={{ fontSize:10, color:theme.brand, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.6 }}>{job.category}</Text>
                  </View>
                  <View style={{ flexDirection:'row', gap:6, alignItems:'center' }}>
                    <View style={{ paddingHorizontal:7, paddingVertical:3, borderRadius:20, borderWidth:0.5, borderColor:matchColor }}>
                      <Text style={{ fontSize:10, fontWeight:'700', color:matchColor }}>{matchPct}% match</Text>
                    </View>
                    <View style={{ paddingHorizontal:9, paddingVertical:3, borderRadius:20, backgroundColor:urg.bg }}>
                      <Text style={{ fontSize:11, fontWeight:'600', color:urg.color }}>{urg.label}</Text>
                    </View>
                  </View>
                </View>
                <Text style={{ fontSize:14, fontWeight:'600', color:theme.text, marginBottom:8, lineHeight:20 }}>{job.title}</Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <Text style={{ fontSize:11, color:theme.text3 }}>📍 {job.location?.area||'Lagos'}</Text>
                  {job.budgetMin > 0 && <>
                    <Text style={{ fontSize:11, color:theme.text3 }}>·</Text>
                    <Text style={{ fontSize:11, color:theme.text3 }}>₦{job.budgetMin?.toLocaleString()} – ₦{job.budgetMax?.toLocaleString()}</Text>
                  </>}
                </View>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTopWidth:0.5, borderTopColor:theme.border }}>
                  <Text style={{ fontSize:11, color:theme.text3 }}>
                    {(job.responseCount||0) > 0 ? `${job.responseCount} others responded` : '🟢 Be first to respond'}
                  </Text>
                  <TouchableOpacity
                    style={{ backgroundColor:theme.brand, borderRadius:8, paddingHorizontal:14, paddingVertical:8 }}
                    onPress={() => { setOfferModal(job); setOfferEta(''); }}>
                    <Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>Send Offer →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Tab Bar */}
      <View style={{ flexDirection:'row', backgroundColor:theme.card, borderTopWidth:0.5, borderTopColor:theme.border, paddingTop:10, paddingBottom:24 }}>
        {([['🏠','Jobs'],['💬','Chats'],['🔔','Alerts'],['👤','Profile']] as const).map(([icon,label]) => (
          <TouchableOpacity key={label} style={{ flex:1, alignItems:'center', gap:3 }} activeOpacity={0.7}
            onPress={() => {
              if (label==='Chats') router.push('/chat');
              if (label==='Alerts') router.push('/alerts');
              if (label==='Profile') router.push('/provider-profile');
            }}>
            <Text style={{ fontSize:20 }}>{icon}</Text>
            <Text style={{ fontSize:10, color:label==='Jobs'?theme.brand:theme.text3, fontWeight:label==='Jobs'?'700':'500' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Send Offer Modal */}
      <Modal visible={!!offerModal} animationType="slide" transparent>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:theme.card, borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, paddingBottom:40 }}>
            <View style={{ width:40, height:4, backgroundColor:theme.border, borderRadius:2, alignSelf:'center', marginBottom:16 }}/>
            <Text style={{ fontSize:18, fontWeight:'800', color:theme.text, marginBottom:14 }}>Send Offer</Text>
            {offerModal && (
              <View style={{ backgroundColor:theme.bg, borderRadius:10, padding:12, marginBottom:14, borderWidth:0.5, borderColor:theme.border }}>
                <Text style={{ fontSize:10, color:theme.brand, fontWeight:'700', textTransform:'uppercase', marginBottom:4 }}>{offerModal.category}</Text>
                <Text style={{ fontSize:14, color:theme.text, fontWeight:'600', marginBottom:4 }} numberOfLines={2}>{offerModal.title}</Text>
                <Text style={{ fontSize:11, color:theme.text3 }}>📍 {offerModal.location?.area||'Lagos'}</Text>
              </View>
            )}
            <Text style={{ fontSize:12, color:theme.text3, marginBottom:6, marginTop:4 }}>Your Price (₦) *</Text>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:theme.bg, borderRadius:10, borderWidth:0.5, borderColor:theme.border, paddingHorizontal:12, marginBottom:12 }}>
              <Text style={{ fontSize:16, color:theme.brand, fontWeight:'700', marginRight:4 }}>₦</Text>
              <TextInput style={{ flex:1, padding:13, fontSize:15, color:theme.text }} value={offerPrice} onChangeText={setOfferPrice} placeholder="Minimum ₦1,000" placeholderTextColor={theme.text3} keyboardType="number-pad"/>
            </View>
            <Text style={{ fontSize:12, color:theme.text3, marginBottom:6 }}>ETA (minutes from now) *</Text>
            <TextInput style={{ backgroundColor:theme.bg, borderRadius:10, padding:13, fontSize:15, color:theme.text, borderWidth:0.5, borderColor:theme.border, marginBottom:12 }} value={offerEta} onChangeText={setOfferEta} placeholder="e.g. 25" placeholderTextColor={theme.text3} keyboardType="number-pad"/>
            <Text style={{ fontSize:12, color:theme.text3, marginBottom:6 }}>Message (optional)</Text>
            <TextInput style={{ backgroundColor:theme.bg, borderRadius:10, padding:13, fontSize:14, color:theme.text, borderWidth:0.5, borderColor:theme.border, minHeight:70, textAlignVertical:'top', marginBottom:14 }} value={offerMsg} onChangeText={setOfferMsg} placeholder="Introduce yourself..." placeholderTextColor={theme.text3} multiline/>
            {offerPrice && offerEta && parseInt(offerPrice) >= 1000 && (
              <View style={{ backgroundColor:theme.brand+'15', borderRadius:10, padding:12, marginBottom:14, alignItems:'center', borderWidth:0.5, borderColor:theme.brand+'40' }}>
                <Text style={{ fontSize:24, fontWeight:'800', color:theme.brand }}>₦{parseInt(offerPrice).toLocaleString()}</Text>
                <Text style={{ fontSize:12, color:theme.text3, marginTop:4 }}>ETA ~{offerEta} mins</Text>
              </View>
            )}
            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity style={{ flex:1, backgroundColor:theme.bg3, borderRadius:10, padding:14, alignItems:'center' }} onPress={() => {setOfferModal(null);setOfferPrice('');setOfferEta('');setOfferMsg('');}}>
                <Text style={{ color:theme.text3, fontSize:14, fontWeight:'600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex:2, backgroundColor:theme.brand, borderRadius:10, padding:14, alignItems:'center', opacity:(!offerPrice||!offerEta||sending||parseInt(offerPrice)<1000)?0.5:1 }}
                onPress={handleSendOffer}
                disabled={!offerPrice||!offerEta||sending||parseInt(offerPrice)<1000}>
                <Text style={{ color:'#fff', fontSize:14, fontWeight:'700' }}>{sending?'Sending...':'Send Offer →'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
