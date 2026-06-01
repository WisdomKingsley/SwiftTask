import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function PaymentSettings() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Payment Settings</Text>
        <View style={{ width:50 }}/>
      </View>
      <ScrollView contentContainerStyle={{ padding:16 }}>
        <View style={{ backgroundColor:theme.card, borderRadius:16, padding:20, marginBottom:14, borderWidth:0.5, borderColor:theme.border, alignItems:'center' }}>
          <Text style={{ fontSize:13, color:theme.text3, fontWeight:'600', marginBottom:8 }}>SwiftTask Wallet</Text>
          <Text style={{ fontSize:36, fontWeight:'800', color:theme.text, marginBottom:6 }}>₦0.00</Text>
          <Text style={{ fontSize:12, color:theme.text3 }}>Your balance appears here once payments launch</Text>
        </View>
        <View style={{ backgroundColor:theme.brand+'10', borderRadius:14, padding:16, marginBottom:14, borderWidth:0.5, borderColor:theme.brand+'40' }}>
          <Text style={{ fontSize:28, marginBottom:10 }}>🔒</Text>
          <Text style={{ fontSize:15, fontWeight:'700', color:theme.text, marginBottom:8 }}>Secure Payments Coming Soon</Text>
          <Text style={{ fontSize:13, color:theme.text3, marginBottom:12, lineHeight:19 }}>We are integrating Paystack — Nigeria's most trusted payment platform — to enable:</Text>
          {['✓ Secure escrow — pay only when job is done','✓ Instant provider payouts to any Nigerian bank','✓ Wallet top-up via card or bank transfer','✓ Full dispute protection for both parties'].map((f,i)=>(
            <Text key={i} style={{ fontSize:13, color:theme.text2, marginBottom:6 }}>{f}</Text>
          ))}
        </View>
        <View style={{ backgroundColor:theme.card, borderRadius:14, marginBottom:14, borderWidth:0.5, borderColor:theme.border, overflow:'hidden' }}>
          <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, padding:14, paddingBottom:8 }}>Payment Methods</Text>
          {[{icon:'💳',label:'Debit / Credit Card'},{icon:'🏦',label:'Bank Transfer'}].map((m,i,arr)=>(
            <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14, borderBottomWidth:i===arr.length-1?0:0.5, borderBottomColor:theme.border, opacity:0.5 }}>
              <View style={{ width:36, height:36, borderRadius:10, backgroundColor:theme.bg3, alignItems:'center', justifyContent:'center' }}>
                <Text style={{ fontSize:18 }}>{m.icon}</Text>
              </View>
              <Text style={{ fontSize:14, color:theme.text, fontWeight:'500', flex:1 }}>{m.label}</Text>
              <Text style={{ fontSize:11, color:theme.brand }}>Coming soon</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
