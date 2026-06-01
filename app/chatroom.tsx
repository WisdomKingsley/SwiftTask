import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { get, onValue, push, ref, serverTimestamp, set } from 'firebase/database';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { rtdb, db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const REPLIES = ['Got it! On my way shortly.','No problem at all.','Sure thing! I can handle that.','Understood. Will be there soon.','Perfect, see you shortly!'];
const LOCK_HOURS = 24;

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { name, initials, color, chatId: paramChatId, providerId, requestId, requestCreatedAt } = useLocalSearchParams<{
    name:string; initials:string; color:string; chatId:string;
    providerId:string; requestId:string; requestCreatedAt:string;
  }>();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [myPhone, setMyPhone] = useState('');
  const [myRole, setMyRole] = useState('');
  const [chatId, setChatId] = useState('');
  const [firstMsgSent, setFirstMsgSent] = useState(false);
  const listRef = useRef<FlatList>(null);

  // ── CHAT LOCK STATE ──────────────────────────────────────────
  const [chatLocked, setChatLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  // ── LIVE LOCATION STATE ──────────────────────────────────────
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [otherLocation, setOtherLocation] = useState<{lat:number;lng:number;name:string;updatedAt:number}|null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [distanceText, setDistanceText] = useState('');
  const locationIntervalRef = useRef<any>(null);
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const phone = await AsyncStorage.getItem('userPhone') || 'unknown';
      const role = await AsyncStorage.getItem('userRole') || 'customer';
      setMyPhone(phone);
      setMyRole(role);
      const id = paramChatId || `chat_${[phone, providerId||name].sort().join('_')}`;
      setChatId(id);

      // ── CHECK CHAT LOCK ──────────────────────────────────────
      if (requestId) {
        const jobRef = doc(db, 'requests', requestId);
        onSnapshot(jobRef, snap => {
          if (!snap.exists()) return;
          const job = snap.data();
          if (job.status === 'completed' && job.completedAt) {
            const completedAt = job.completedAt?.toDate?.() || new Date(job.completedAt);
            const hoursSince = (Date.now() - completedAt.getTime()) / 3600000;
            if (hoursSince >= LOCK_HOURS) {
              setChatLocked(true);
              setLockReason(`This job was completed ${Math.round(hoursSince)} hours ago.`);
            }
          }
        });
      }
      // ─────────────────────────────────────────────────────────

      const msgsRef = ref(rtdb, `messages/${id}`);
      onValue(msgsRef, snap => {
        const data = snap.val();
        if (!data) { setMessages([]); return; }
        const msgs = Object.entries(data)
          .map(([k,v]:any) => ({id:k,...v}))
          .sort((a,b) => (a.createdAt||0)-(b.createdAt||0));
        setMessages(msgs);
        setTimeout(()=>listRef.current?.scrollToEnd({animated:true}),100);
      });

      // Listen for other party's live location
      const locRef = ref(rtdb, `liveLocation/${id}`);
      onValue(locRef, snap => {
        const data = snap.val();
        if (!data) { setOtherLocation(null); return; }
        Object.entries(data).forEach(([key, val]: [string, any]) => {
          if (key !== phone.replace('+','').replace(/ /g,'') && val?.lat) {
            setOtherLocation({ lat:val.lat, lng:val.lng, name:val.name||name||'Provider', updatedAt:val.updatedAt||Date.now() });
            calculateDistance(val.lat, val.lng);
          }
        });
      });
    };
    init();
    return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
  }, []);

  // ── REBOOK HANDLER ───────────────────────────────────────────
  const handleRebook = () => {
    router.push({
      pathname: '/post',
      params: {
        prefillProvider: providerId || '',
        prefillName: name || '',
        isRebook: 'true',
      }
    });
  };
  // ─────────────────────────────────────────────────────────────

  // ── LOCATION HELPERS ─────────────────────────────────────────
  const calculateDistance = (otherLat: number, otherLng: number) => {
    navigator.geolocation?.getCurrentPosition(pos => {
      const R = 6371;
      const dLat = (otherLat - pos.coords.latitude) * Math.PI / 180;
      const dLon = (otherLng - pos.coords.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(pos.coords.latitude*Math.PI/180)*Math.cos(otherLat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
      const dist = R * 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
      setDistanceText(dist < 1 ? `${Math.round(dist*1000)}m away` : `${dist.toFixed(1)}km away`);
    });
  };

  const startSharingLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed','Allow location access to share with customer.'); return; }
    const userName = await AsyncStorage.getItem('userName') || name || 'Provider';
    const phoneKey = myPhone.replace('+','').replace(/ /g,'');
    setIsSharingLocation(true);
    const msgRef = ref(rtdb, `messages/${chatId}`);
    await push(msgRef, { from:myPhone, senderName:userName, text:'📍 Live location sharing started. Track my arrival in real time.', type:'system', createdAt:Date.now(), read:false });
    const writeLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy:Location.Accuracy.Balanced });
        await set(ref(rtdb, `liveLocation/${chatId}/${phoneKey}`), { lat:loc.coords.latitude, lng:loc.coords.longitude, name:userName, updatedAt:Date.now(), active:true });
      } catch {}
    };
    writeLocation();
    locationIntervalRef.current = setInterval(writeLocation, 10000);
  };

  const stopSharingLocation = async () => {
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    setIsSharingLocation(false);
    const phoneKey = myPhone.replace('+','').replace(/ /g,'');
    await set(ref(rtdb, `liveLocation/${chatId}/${phoneKey}`), { active:false, updatedAt:Date.now() });
    await push(ref(rtdb, `messages/${chatId}`), { from:myPhone, senderName:name||'Provider', text:'📍 Live location sharing stopped.', type:'system', createdAt:Date.now(), read:false });
  };

  const openInMaps = () => {
    if (!otherLocation) return;
    Linking.openURL(`https://maps.google.com/?q=${otherLocation.lat},${otherLocation.lng}`);
  };
  // ─────────────────────────────────────────────────────────────

  const sendMsg = async (text: string, type='text', offerData?: any) => {
    if (!text.trim() && type==='text') return;
    if (chatLocked) return;
    const msgRef = ref(rtdb, `messages/${chatId}`);
    if (myRole === 'provider' && !firstMsgSent && requestCreatedAt && providerId) {
      try {
        const elapsed = (Date.now() - parseInt(requestCreatedAt)) / 60000;
        const provRef = doc(db, 'users', myPhone);
        const provSnap = await getDoc(provRef);
        if (provSnap.exists()) {
          const current = provSnap.data().providerProfile?.responseTimeMins || 0;
          const count = provSnap.data().stats?.responseCount || 0;
          const newAvg = count === 0 ? elapsed : ((current * count) + elapsed) / (count + 1);
          await updateDoc(provRef, { 'providerProfile.responseTimeMins': Math.round(newAvg), 'stats.responseCount': count + 1 });
        }
        setFirstMsgSent(true);
      } catch {}
    }
    await push(msgRef, { from:myPhone, senderName:name||'User', text:text.trim(), type, offer:offerData||null, createdAt:Date.now(), read:false });
    setInput('');
    if (type==='text' && myRole==='customer') {
      setTyping(true);
      setTimeout(async()=>{
        setTyping(false);
        await push(msgRef, { from:providerId||'provider', senderName:name||'Provider', text:REPLIES[Math.floor(Math.random()*REPLIES.length)], type:'text', createdAt:Date.now()+100, read:false });
      },1500);
    }
  };

  const acceptOffer = async (msgId:string) => {
    // Generate 4-digit PIN for job verification
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    await set(ref(rtdb,`messages/${chatId}/${msgId}/offer/status`),'accepted');
    // Write PIN to job document in Firestore
    if (requestId) {
      try {
        await updateDoc(doc(db, 'requests', requestId), {
          verificationPin: pin,
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
        });
      } catch {}
    }
    await sendMsg(`Offer accepted! ✅ Your job verification PIN is: ${pin} — Share this PIN with the provider when they arrive to start the job.`,'text');
  };

  const renderMessage = ({item}:{item:any}) => {
    const isMine = item.from === myPhone;
    if (item.type === 'system') {
      return (
        <View style={{ alignItems:'center', marginVertical:8 }}>
          <View style={{ backgroundColor:theme.bg3, paddingHorizontal:14, paddingVertical:7, borderRadius:20 }}>
            <Text style={{ fontSize:11, color:theme.text3, textAlign:'center' }}>{item.text}</Text>
          </View>
        </View>
      );
    }
    if (item.type==='offer') {
      return (
        <View style={[st.offerCard,{backgroundColor:theme.card,borderColor:theme.brand}]}>
          <Text style={[st.offerLabel,{color:theme.text3}]}>Provider Offer</Text>
          <Text style={st.offerPrice}>₦{item.offer?.price?.toLocaleString()}</Text>
          <Text style={[st.offerEta,{color:theme.text3}]}>ETA ~{item.offer?.eta} mins · Labour included</Text>
          {item.offer?.status==='pending' ? (
            <View style={st.offerBtns}>
              <TouchableOpacity style={st.acceptBtn} onPress={()=>acceptOffer(item.id)}>
                <Text style={st.acceptTxt}>Accept & Hire ✓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[st.counterBtn,{borderColor:theme.border}]} onPress={()=>setInput('Can you do ₦')}>
                <Text style={[st.counterTxt,{color:theme.text3}]}>Counter</Text>
              </TouchableOpacity>
            </View>
          ) : <Text style={st.acceptedTxt}>✓ Offer accepted</Text>}
        </View>
      );
    }
    return (
      <View style={[st.msgRow, isMine && st.msgRowMe]}>
        {!isMine && (
          <View style={[st.msgAv,{backgroundColor:(color||'#FF5C00')+'30'}]}>
            <Text style={{fontSize:10,fontWeight:'700',color:color||'#FF5C00'}}>{(initials||'P')[0]}</Text>
          </View>
        )}
        <View style={[st.bubble, isMine ? st.bubbleMe : [st.bubbleThem,{backgroundColor:theme.bg3}]]}>
          <Text style={[st.bubbleTxt,{color:isMine?'#fff':theme.text}]}>{item.text}</Text>
          <Text style={[st.msgTime, isMine?{textAlign:'right',color:'rgba(255,255,255,0.6)'}:{color:theme.text3}]}>
            {new Date(item.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}{isMine?' ✓✓':''}
          </Text>
        </View>
      </View>
    );
  };

  const isLocationFresh = otherLocation && (Date.now() - otherLocation.updatedAt) < 30000;

  return (
    <View style={[st.safe,{paddingTop:insets.top,backgroundColor:theme.bg}]}>

      {/* HEADER */}
      <View style={[st.header,{borderBottomColor:theme.border,backgroundColor:theme.bg}]}>
        <TouchableOpacity onPress={()=>router.back()} style={{padding:4}}>
          <Text style={st.back}>←</Text>
        </TouchableOpacity>
        <View style={[st.avatar,{backgroundColor:(color||'#FF5C00')+'25'}]}>
          <Text style={[st.avatarTxt,{color:color||'#FF5C00'}]}>{initials||'P'}</Text>
        </View>
        <View style={st.headerInfo}>
          <Text style={[st.headerName,{color:theme.text}]}>{name||'Provider'}</Text>
          <Text style={st.headerStatus}>{chatLocked ? '🔒 Chat locked' : '● Active now'}</Text>
        </View>
        {myRole === 'provider' ? (
          <TouchableOpacity
            style={[st.locBtn,{backgroundColor:isSharingLocation?'#2ECC71':theme.bg3,borderColor:isSharingLocation?'#2ECC71':theme.border}]}
            onPress={isSharingLocation?stopSharingLocation:startSharingLocation}>
            <Text style={{fontSize:13}}>📍</Text>
            <Text style={{fontSize:10,fontWeight:'700',color:isSharingLocation?'#fff':theme.text3}}>{isSharingLocation?'Live':'Share'}</Text>
          </TouchableOpacity>
        ) : otherLocation && isLocationFresh ? (
          <TouchableOpacity style={[st.locBtn,{backgroundColor:'#2ECC71',borderColor:'#2ECC71'}]} onPress={()=>setShowLocationModal(true)}>
            <Text style={{fontSize:13}}>📍</Text>
            <Text style={{fontSize:10,fontWeight:'700',color:'#fff'}}>Live</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[st.headerTrust,{color:theme.text3}]}>✓ Verified{'\n'}⭐ 4.9</Text>
        )}
      </View>

      {/* LIVE LOCATION BANNER */}
      {myRole==='customer' && otherLocation && isLocationFresh && (
        <TouchableOpacity style={[st.locBanner,{backgroundColor:'#2ECC71'+'18',borderBottomColor:'#2ECC71'+'40'}]} onPress={()=>setShowLocationModal(true)}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
            <View style={st.pulseDot}/>
            <Text style={{fontSize:12,fontWeight:'700',color:'#2ECC71'}}>{otherLocation.name} is sharing live location</Text>
            {distanceText?<Text style={{fontSize:11,color:'#2ECC71',opacity:0.8}}>· {distanceText}</Text>:null}
          </View>
          <Text style={{fontSize:11,color:'#2ECC71',fontWeight:'600'}}>View →</Text>
        </TouchableOpacity>
      )}

      {/* PROVIDER SHARING BANNER */}
      {myRole==='provider' && isSharingLocation && (
        <View style={[st.locBanner,{backgroundColor:'#2ECC71'+'18',borderBottomColor:'#2ECC71'+'40'}]}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
            <View style={st.pulseDot}/>
            <Text style={{fontSize:12,fontWeight:'700',color:'#2ECC71'}}>Sharing your live location</Text>
          </View>
          <TouchableOpacity onPress={stopSharingLocation}>
            <Text style={{fontSize:11,color:'#E74C3C',fontWeight:'600'}}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CHAT LOCK BANNER */}
      {chatLocked && (
        <View style={{backgroundColor:theme.amber+'18',paddingHorizontal:16,paddingVertical:10,borderBottomWidth:0.5,borderBottomColor:theme.amber+'40',flexDirection:'row',alignItems:'center',gap:8}}>
          <Text style={{fontSize:14}}>🔒</Text>
          <Text style={{fontSize:12,color:theme.amber,flex:1,lineHeight:17}}>{lockReason} Chat is locked to protect both parties.</Text>
        </View>
      )}

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={0}>
        {messages.length===0 ? (
          <View style={st.emptyChat}>
            <Text style={{fontSize:44,marginBottom:12}}>💬</Text>
            <Text style={[st.emptyChatTxt,{color:theme.text}]}>Start the conversation</Text>
            <Text style={[st.emptyChatSub,{color:theme.text3}]}>Messages are saved in real time</Text>
            {myRole==='provider' && !chatLocked && (
              <TouchableOpacity style={[st.locPrompt,{backgroundColor:theme.card,borderColor:theme.border}]} onPress={startSharingLocation}>
                <Text style={{fontSize:22,marginBottom:6}}>📍</Text>
                <Text style={{fontSize:13,fontWeight:'700',color:theme.text,marginBottom:3}}>Share your live location</Text>
                <Text style={{fontSize:11,color:theme.text3,textAlign:'center',lineHeight:16}}>Build trust instantly. Customers track your arrival in real time — just like Bolt.</Text>
                <View style={[st.locPromptBtn,{backgroundColor:theme.brand}]}>
                  <Text style={{fontSize:12,fontWeight:'700',color:'#fff'}}>Start Sharing →</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item=>item.id}
            contentContainerStyle={st.messagesList}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={()=>listRef.current?.scrollToEnd({animated:true})}
          />
        )}

        {typing && <Text style={[st.typing,{color:theme.text3}]}>{(name||'Provider').split(' ')[0]} is typing…</Text>}

        {/* ── LOCKED CHAT FOOTER ─────────────────────────────── */}
        {chatLocked ? (
          <View style={{paddingHorizontal:16,paddingVertical:14,paddingBottom:insets.bottom+14,backgroundColor:theme.bg,borderTopWidth:0.5,borderTopColor:theme.border}}>
            <View style={{backgroundColor:theme.card,borderRadius:12,padding:14,borderWidth:0.5,borderColor:theme.border,marginBottom:10}}>
              <Text style={{fontSize:12,color:theme.text3,textAlign:'center',marginBottom:3}}>🔒 This chat is locked</Text>
              <Text style={{fontSize:11,color:theme.text3,textAlign:'center'}}>Chat locks 24 hours after job completion to prevent off-platform rebooking.</Text>
            </View>
            <TouchableOpacity
              style={{backgroundColor:theme.brand,borderRadius:12,padding:15,alignItems:'center'}}
              onPress={handleRebook}
              activeOpacity={0.85}>
              <Text style={{color:'#fff',fontSize:15,fontWeight:'700'}}>🔄 Rebook {name?.split(' ')[0] || 'this Provider'} →</Text>
            </TouchableOpacity>
          </View>
        ) : (
        /* ── NORMAL INPUT BAR ──────────────────────────────── */
          <View style={[st.inputBar,{paddingBottom:insets.bottom+8,backgroundColor:theme.bg,borderTopColor:theme.border}]}>
            {myRole==='provider' && !isSharingLocation && (
              <TouchableOpacity style={[st.locIconBtn,{backgroundColor:theme.bg3,borderColor:theme.border}]} onPress={startSharingLocation}>
                <Text style={{fontSize:16}}>📍</Text>
              </TouchableOpacity>
            )}
            <TextInput
              style={[st.input,{backgroundColor:theme.bg3,color:theme.text,borderColor:theme.border}]}
              placeholder="Type a message…"
              placeholderTextColor={theme.text3}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={()=>sendMsg(input)}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity style={st.sendBtn} onPress={()=>sendMsg(input)} activeOpacity={0.8}>
              <Text style={st.sendTxt}>➤</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* LIVE LOCATION MODAL */}
      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.85)',justifyContent:'flex-end'}}>
          <View style={{backgroundColor:theme.card,borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,paddingBottom:40}}>
            <View style={{width:40,height:4,backgroundColor:theme.border,borderRadius:2,alignSelf:'center',marginBottom:20}}/>
            <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:20}}>
              <View style={{width:44,height:44,borderRadius:22,backgroundColor:'#2ECC71'+'25',alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:20}}>📍</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:16,fontWeight:'700',color:theme.text}}>{otherLocation?.name||name} is on the way</Text>
                {distanceText?<Text style={{fontSize:13,color:'#2ECC71',marginTop:2,fontWeight:'600'}}>{distanceText}</Text>:null}
              </View>
              <View style={{alignItems:'flex-end'}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#2ECC71'+'18',paddingHorizontal:10,paddingVertical:5,borderRadius:20}}>
                  <View style={{width:6,height:6,borderRadius:3,backgroundColor:'#2ECC71'}}/>
                  <Text style={{fontSize:11,color:'#2ECC71',fontWeight:'700'}}>LIVE</Text>
                </View>
                {otherLocation&&<Text style={{fontSize:10,color:theme.text3,marginTop:4}}>Updated {Math.round((Date.now()-otherLocation.updatedAt)/1000)}s ago</Text>}
              </View>
            </View>
            <TouchableOpacity style={{backgroundColor:theme.bg,borderRadius:14,padding:20,alignItems:'center',marginBottom:16,borderWidth:0.5,borderColor:theme.border}} onPress={openInMaps}>
              <Text style={{fontSize:32,marginBottom:8}}>🗺️</Text>
              <Text style={{fontSize:13,fontWeight:'700',color:theme.text,marginBottom:4}}>Open in Google Maps</Text>
              <Text style={{fontSize:11,color:theme.text3}}>{otherLocation?`${otherLocation.lat.toFixed(4)}, ${otherLocation.lng.toFixed(4)}`:'Loading...'}</Text>
            </TouchableOpacity>
            <View style={{flexDirection:'row',gap:10,marginBottom:20}}>
              <View style={{flex:1,backgroundColor:theme.bg,borderRadius:10,padding:12,alignItems:'center',borderWidth:0.5,borderColor:theme.border}}>
                <Text style={{fontSize:18,marginBottom:4}}>🔒</Text>
                <Text style={{fontSize:11,color:theme.text3,textAlign:'center',lineHeight:15}}>Location only shared during active job</Text>
              </View>
              <View style={{flex:1,backgroundColor:theme.bg,borderRadius:10,padding:12,alignItems:'center',borderWidth:0.5,borderColor:theme.border}}>
                <Text style={{fontSize:18,marginBottom:4}}>⏱️</Text>
                <Text style={{fontSize:11,color:theme.text3,textAlign:'center',lineHeight:15}}>Updates every 10 seconds</Text>
              </View>
            </View>
            <TouchableOpacity style={{backgroundColor:theme.brand,borderRadius:12,padding:15,alignItems:'center'}} onPress={openInMaps}>
              <Text style={{color:'#fff',fontSize:14,fontWeight:'700'}}>Track in Google Maps →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{marginTop:12,alignItems:'center'}} onPress={()=>setShowLocationModal(false)}>
              <Text style={{fontSize:13,color:theme.text3}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  safe:{flex:1},
  header:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:14,paddingVertical:12,borderBottomWidth:0.5},
  back:{color:'#FF5C00',fontSize:22},
  avatar:{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',flexShrink:0},
  avatarTxt:{fontSize:13,fontWeight:'700'},
  headerInfo:{flex:1},
  headerName:{fontSize:14,fontWeight:'700'},
  headerStatus:{fontSize:11,color:'#2ECC71',marginTop:1},
  headerTrust:{fontSize:10,textAlign:'right',lineHeight:16},
  locBtn:{flexDirection:'column',alignItems:'center',justifyContent:'center',paddingHorizontal:10,paddingVertical:6,borderRadius:10,borderWidth:0.5,gap:1,minWidth:48},
  locBanner:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingVertical:9,borderBottomWidth:0.5},
  pulseDot:{width:8,height:8,borderRadius:4,backgroundColor:'#2ECC71'},
  messagesList:{padding:14,paddingBottom:8},
  emptyChat:{flex:1,alignItems:'center',justifyContent:'center',padding:32},
  emptyChatTxt:{fontSize:16,fontWeight:'700',marginBottom:6},
  emptyChatSub:{fontSize:13},
  locPrompt:{borderRadius:16,padding:20,alignItems:'center',marginTop:24,borderWidth:0.5,width:'100%'},
  locPromptBtn:{marginTop:14,paddingHorizontal:20,paddingVertical:10,borderRadius:10},
  msgRow:{alignItems:'flex-start',marginBottom:10,flexDirection:'row',gap:8},
  msgRowMe:{alignItems:'flex-end',flexDirection:'row-reverse'},
  msgAv:{width:28,height:28,borderRadius:14,alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2},
  bubble:{maxWidth:'75%',paddingHorizontal:12,paddingVertical:9,borderRadius:16},
  bubbleMe:{backgroundColor:'#FF5C00',borderBottomRightRadius:4},
  bubbleThem:{borderBottomLeftRadius:4},
  bubbleTxt:{fontSize:13,lineHeight:19},
  msgTime:{fontSize:10,marginTop:4},
  offerCard:{borderWidth:0.5,borderRadius:14,padding:14,marginBottom:10,maxWidth:'88%',alignSelf:'flex-start'},
  offerLabel:{fontSize:10,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6},
  offerPrice:{fontSize:26,fontWeight:'800',color:'#FF5C00'},
  offerEta:{fontSize:11,marginTop:4,marginBottom:12},
  offerBtns:{flexDirection:'row',gap:8},
  acceptBtn:{flex:1,backgroundColor:'#FF5C00',borderRadius:8,padding:11,alignItems:'center'},
  acceptTxt:{color:'#FFFFFF',fontSize:12,fontWeight:'700'},
  counterBtn:{flex:1,borderWidth:0.5,borderRadius:8,padding:11,alignItems:'center'},
  counterTxt:{fontSize:12},
  acceptedTxt:{color:'#2ECC71',fontSize:13,fontWeight:'600'},
  typing:{fontSize:11,fontStyle:'italic',paddingHorizontal:16,paddingVertical:6},
  inputBar:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12,paddingTop:10,borderTopWidth:0.5},
  locIconBtn:{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',borderWidth:0.5,flexShrink:0},
  input:{flex:1,borderRadius:22,paddingHorizontal:16,paddingVertical:11,fontSize:13,borderWidth:0.5,maxHeight:100},
  sendBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#FF5C00',alignItems:'center',justifyContent:'center',flexShrink:0},
  sendTxt:{color:'#FFFFFF',fontSize:16},
});
