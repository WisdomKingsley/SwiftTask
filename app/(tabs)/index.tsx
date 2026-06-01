import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good evening'; // 10pm-5am also Good evening (not Good night)
}

const CAT_ICONS: Record<string,string> = {
  'inverter_solar':'🔋','ac_specialist':'❄️','generator_mechanic':'⚡',
  'deep_cleaning':'🧼','borehole_plumbing':'🚰','smart_home_cctv':'👨‍💻',
  'vehicle_diagnostics':'🚗','elite_barber_hair':'💈','luxury_nail_spa':'💅',
  'secured_logistics':'📦',
  // legacy fallbacks
  'Plumbing':'🚰','Electrical':'⚡','Tech Repair':'👨‍💻','Delivery':'📦',
  'Cleaning':'🧼','Mechanic':'🚗','Barbing':'💈','Hair Dressing':'💈',
  'Nail Technician':'💅','Other':'📦',
};

const SEED_JOBS = [
  { id:'s1', title:'Inverter making noise — needs urgent service', category:'generator_mechanic', urgency:'now', location:{area:'Lekki Phase 1'}, budgetMin:15000, budgetMax:40000, responseCount:3, isSeeded:true },
  { id:'s2', title:'AC not cooling at all — split unit needs fixing', category:'ac_specialist', urgency:'today', location:{area:'Victoria Island'}, budgetMin:10000, budgetMax:35000, responseCount:2, isSeeded:true },
  { id:'s3', title:'CCTV installation — 4 cameras, 2 floors', category:'smart_home_cctv', urgency:'flexible', location:{area:'Ikoyi'}, budgetMin:80000, budgetMax:200000, responseCount:1, isSeeded:true },
  { id:'s4', title:'Elite home barber — fresh cut and beard trim', category:'elite_barber_hair', urgency:'today', location:{area:'Lekki'}, budgetMin:8000, budgetMax:20000, responseCount:4, isSeeded:true },
  { id:'s5', title:'Gel nails full set — luxury mobile service', category:'luxury_nail_spa', urgency:'flexible', location:{area:'VI'}, budgetMin:15000, budgetMax:40000, responseCount:2, isSeeded:true },
  { id:'s6', title:'Generator service — Mikano 20KVA not starting', category:'generator_mechanic', urgency:'now', location:{area:'Ajah'}, budgetMin:20000, budgetMax:60000, responseCount:5, isSeeded:true },
];

const FILTERS = ['My Requests','All Nearby','⚡ Urgent','🔋 Inverter & Solar','❄️ AC','⚡ Generator','🧼 Cleaning','🚰 Plumbing','👨‍💻 Smart Home','🚗 Vehicle','💈 Barber & Hair','💅 Nail & Spa','📦 Logistics'];
const FILTER_MAP: Record<string,string[]> = {
  '🔋 Inverter & Solar':['inverter_solar'],
  '❄️ AC':['ac_specialist'],
  '⚡ Generator':['generator_mechanic'],
  '🧼 Cleaning':['deep_cleaning'],
  '🚰 Plumbing':['borehole_plumbing'],
  '👨‍💻 Smart Home':['smart_home_cctv'],
  '🚗 Vehicle':['vehicle_diagnostics'],
  '💈 Barber & Hair':['elite_barber_hair'],
  '💅 Nail & Spa':['luxury_nail_spa'],
  '📦 Logistics':['secured_logistics'],
};
const URG: Record<string, {label:string;color:string;bg:string}> = {
  now:      {label:'⚡ Now',      color:'#FF5C00', bg:'#FF5C0018'},
  today:    {label:'📅 Today',    color:'#F59E0B', bg:'#F59E0B18'},
  flexible: {label:'🗓 Flexible', color:'#888',    bg:'#88888818'},
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('My Requests');
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState('Detecting...');
  const [locLoading, setLocLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [myPhone, setMyPhone] = useState('');
  const [greeting, setGreeting] = useState(getGreeting());
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Update greeting every minute
    const greetTimer = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(greetTimer);
  }, []);

  useEffect(() => {
    const init = async () => {
      const phone = await AsyncStorage.getItem('userPhone') || '';
      const storedName = await AsyncStorage.getItem('userName') || '';
      setUserName(storedName);
      setMyPhone(phone);
      getLocation();

      // All open requests (for "All Nearby" and category filters)
      const allQ = query(collection(db, 'requests'), where('status','==','open'), orderBy('createdAt','desc'));
      const unsubAll = onSnapshot(allQ,
        snap => {
          const real = snap.docs.map(d => ({id:d.id,...d.data()}));
          setAllJobs(real.length < 3 ? [...real,...SEED_JOBS].slice(0,12) : real);
          setJobsLoading(false);
        },
        () => { setAllJobs(SEED_JOBS); setJobsLoading(false); }
      );

      // User's own requests
      if (phone) {
        const myQ = query(collection(db, 'requests'), where('customerId','==',phone), orderBy('createdAt','desc'));
        const unsubMy = onSnapshot(myQ,
          snap => setMyJobs(snap.docs.map(d => ({id:d.id,...d.data()}))),
          () => setMyJobs([])
        );
        return () => { unsubAll(); unsubMy(); };
      }
      return unsubAll;
    };
    init();
  }, []);

  const getLocation = async () => {
    setLocLoading(true);
    try {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocation('Lagos, Nigeria'); setLocLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      const geo = await Location.reverseGeocodeAsync({latitude:loc.coords.latitude,longitude:loc.coords.longitude});
      if (geo.length > 0) setLocation(`${geo[0].district||geo[0].city||'Lagos'}, Nigeria`);
    } catch { setLocation('Lagos, Nigeria'); }
    finally { setLocLoading(false); }
  };

  const getFiltered = () => {
    if (filter === 'My Requests') return myJobs;
    let source = allJobs;
    if (filter === '⚡ Urgent') return source.filter(j => j.urgency === 'now');
    const cats = FILTER_MAP[filter];
    if (cats) return source.filter(j => cats.includes(j.category));
    if (filter !== 'All Nearby') return source.filter(j => j.category === filter);
    return source;
  };

  const filtered = getFiltered().sort((a:any,b:any) => {
    const o:Record<string,number>={now:0,today:1,flexible:2};
    return (o[a.urgency]??2)-(o[b.urgency]??2);
  });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <View style={s.header}>
        <View>
          <Text style={[s.greet, {color:theme.text}]}>{greeting}, {userName ? userName.split(" ")[0] : "there"} 👋</Text>
          <View style={s.locRow}>
            <Text style={{fontSize:12}}>📍</Text>
            {locLoading
              ? <ActivityIndicator size="small" color="#FF5C00" style={{marginLeft:4}}/>
              : <Text style={s.loc}> {location}</Text>}
          </View>
        </View>
        <TouchableOpacity style={s.notifBtn} onPress={()=>router.push('/alerts')}>
          <Text style={{fontSize:17}}>🔔</Text>
          <View style={s.notifDot}/>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {FILTERS.map(f=>(
          <TouchableOpacity key={f} style={[s.pill, filter===f && s.pillActive]} onPress={()=>setFilter(f)}>
            <Text style={[s.pillTxt, filter===f && s.pillTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={s.feed} contentContainerStyle={s.feedContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await getLocation();setRefreshing(false);}} tintColor="#FF5C00"/>}
        showsVerticalScrollIndicator={false}>

        {jobsLoading && (
          <View style={s.center}><ActivityIndicator color="#FF5C00" size="large"/>
            <Text style={s.loadTxt}>Loading...</Text></View>
        )}

        {!jobsLoading && filter === 'My Requests' && myJobs.length === 0 && (
          <View style={s.center}>
            <Text style={{fontSize:40,marginBottom:12}}>📋</Text>
            <Text style={[s.emptyTitle, {color:theme.text}]}>No requests yet</Text>
            <Text style={s.emptySub}>Tap "Post a Request" to get help near you</Text>
            <TouchableOpacity style={s.postInline} onPress={()=>router.push('/post')}>
              <Text style={s.postInlineTxt}>Post your first request →</Text>
            </TouchableOpacity>
          </View>
        )}

        {!jobsLoading && filter !== 'My Requests' && filtered.length === 0 && (
          <View style={s.center}>
            <Text style={{fontSize:40,marginBottom:12}}>🔍</Text>
            <Text style={s.emptyTitle}>No requests in this category</Text>
            <Text style={s.emptySub}>Be the first to post</Text>
          </View>
        )}

        {!jobsLoading && filtered.map((job:any) => {
          const urg = URG[job.urgency] || URG.flexible;
          const icon = CAT_ICONS[job.category] || '📦';
          const isOwn = job.customerId === myPhone;
          return (
            <TouchableOpacity key={job.id} style={s.card} activeOpacity={0.75}>
              {job.isSeeded && <View style={s.seededTag}><Text style={s.seededTxt}>Recent activity near you</Text></View>}
              {isOwn && filter !== 'My Requests' && <View style={[s.seededTag,{backgroundColor:'#FF5C0018',borderColor:'#FF5C00',borderWidth:0.5}]}><Text style={[s.seededTxt,{color:'#FF5C00'}]}>Your request</Text></View>}
              <View style={s.cardTop}>
                <View style={s.catRow}>
                  <Text style={s.catIcon}>{icon}</Text>
                  <Text style={s.cardCat}>{job.category}</Text>
                </View>
                <View style={[s.urgBadge,{backgroundColor:urg.bg}]}>
                  <Text style={[s.urgTxt,{color:urg.color}]}>{urg.label}</Text>
                </View>
              </View>
              <Text style={s.cardTitle}>{job.title}</Text>
              <View style={s.cardMeta}>
                <Text style={s.metaTxt}>📍 {job.location?.area||'Lagos'}</Text>
                {job.budgetMin > 0 && <>
                  <Text style={s.metaDot}>·</Text>
                  <Text style={s.metaTxt}>₦{job.budgetMin?.toLocaleString()} – ₦{job.budgetMax?.toLocaleString()}</Text>
                </>}
              </View>
              <View style={s.cardFooter}>
                <View style={s.rDot}/>
                <Text style={[(job.responseCount||0)===0 && {color:'#666'}, s.responses]}>
                  {(job.responseCount||0)>0 ? `${job.responseCount} provider${job.responseCount>1?'s':''} interested` : 'Be first to respond'}
                </Text>
                {isOwn && <TouchableOpacity style={s.manageBtn}><Text style={s.manageTxt}>Manage</Text></TouchableOpacity>}
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{height:8}}/>
      </ScrollView>

      <View style={s.postWrap}>
        <TouchableOpacity style={s.postBtn} onPress={()=>router.push('/post')} activeOpacity={0.85}>
          <Text style={s.postBtnTxt}>＋  Post a Request</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabBar}>
        {([['🏠','Home'],['💬','Chats'],['🔔','Alerts'],['👤','Profile']] as const).map(([icon,label])=>(
          <TouchableOpacity key={label} style={s.tab} activeOpacity={0.7}
            onPress={()=>{
              if(label==='Chats') router.push('/chat');
              if(label==='Alerts') router.push('/alerts');
              if(label==='Profile') router.push('/customer-profile');
            }}>
            <Text style={s.tabIcon}>{icon}</Text>
            <Text style={[s.tabLabel, label==='Home' && s.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#0F0F14'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:width*0.04,paddingTop:12,paddingBottom:10},
  greet:{fontSize:Math.min(17,width*0.046),fontWeight:'700',color:'#FFFFFF'},
  locRow:{flexDirection:'row',alignItems:'center',marginTop:2},
  loc:{fontSize:12,color:'#FF5C00'},
  notifBtn:{width:36,height:36,borderRadius:18,backgroundColor:'#1A1A22',alignItems:'center',justifyContent:'center'},
  notifDot:{position:'absolute',top:7,right:7,width:8,height:8,borderRadius:4,backgroundColor:'#FF5C00',borderWidth:1.5,borderColor:'#1A1A22'},
  filterScroll:{flexGrow:0,flexShrink:0},
  filterRow:{flexDirection:'row',alignItems:'center',paddingHorizontal:width*0.04,paddingBottom:10,gap:8},
  pill:{height:32,paddingHorizontal:14,borderRadius:16,backgroundColor:'#1A1A22',borderWidth:0.5,borderColor:'#2A2A38',alignItems:'center',justifyContent:'center'},
  pillActive:{backgroundColor:'#FF5C00',borderColor:'#FF5C00'},
  pillTxt:{fontSize:12,color:'#888',fontWeight:'500'},
  pillTxtActive:{color:'#FFFFFF',fontWeight:'700'},
  feed:{flex:1},
  feedContent:{paddingHorizontal:width*0.04,paddingTop:4},
  center:{alignItems:'center',paddingVertical:60},
  loadTxt:{fontSize:13,color:'#666',marginTop:12},
  emptyTitle:{fontSize:16,fontWeight:'700',color:'#FFFFFF',marginBottom:6},
  emptySub:{fontSize:13,color:'#666',marginBottom:20},
  postInline:{backgroundColor:'#FF5C00',borderRadius:10,paddingHorizontal:20,paddingVertical:10},
  postInlineTxt:{color:'#FFFFFF',fontSize:13,fontWeight:'700'},
  seededTag:{backgroundColor:'#2A2A38',borderRadius:4,paddingHorizontal:7,paddingVertical:2,alignSelf:'flex-start',marginBottom:8},
  seededTxt:{fontSize:10,color:'#888'},
  card:{backgroundColor:'#1A1A22',borderRadius:14,padding:width*0.038,marginBottom:10,borderWidth:0.5,borderColor:'#2A2A38'},
  cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  catRow:{flexDirection:'row',alignItems:'center',gap:5},
  catIcon:{fontSize:13},
  cardCat:{fontSize:10,color:'#FF5C00',fontWeight:'700',textTransform:'uppercase',letterSpacing:0.6},
  urgBadge:{paddingHorizontal:9,paddingVertical:3,borderRadius:20},
  urgTxt:{fontSize:11,fontWeight:'600'},
  cardTitle:{fontSize:Math.min(15,width*0.04),fontWeight:'600',color:'#FFFFFF',marginBottom:8,lineHeight:21},
  cardMeta:{flexDirection:'row',alignItems:'center',gap:6},
  metaTxt:{fontSize:12,color:'#666'},
  metaDot:{fontSize:12,color:'#444'},
  cardFooter:{flexDirection:'row',alignItems:'center',gap:6,marginTop:10,paddingTop:10,borderTopWidth:0.5,borderTopColor:'#2A2A38'},
  rDot:{width:6,height:6,borderRadius:3,backgroundColor:'#2ECC71'},
  responses:{fontSize:12,color:'#2ECC71',fontWeight:'500',flex:1},
  manageBtn:{backgroundColor:'#FF5C0018',borderRadius:6,paddingHorizontal:8,paddingVertical:4,borderWidth:0.5,borderColor:'#FF5C00'},
  manageTxt:{fontSize:11,color:'#FF5C00',fontWeight:'600'},
  postWrap:{paddingHorizontal:width*0.04,paddingVertical:10},
  postBtn:{backgroundColor:'#FF5C00',borderRadius:14,paddingVertical:15,alignItems:'center'},
  postBtnTxt:{color:'#FFFFFF',fontSize:15,fontWeight:'700',letterSpacing:0.3},
  tabBar:{flexDirection:'row',backgroundColor:'#1A1A22',borderTopWidth:0.5,borderTopColor:'#2A2A38',paddingTop:10,paddingBottom:24},
  tab:{flex:1,alignItems:'center',gap:3},
  tabIcon:{fontSize:20},
  tabLabel:{fontSize:10,color:'#FFFFFF',fontWeight:'500'},
  tabLabelActive:{color:'#FF5C00',fontWeight:'700'},
});
