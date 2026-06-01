import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Notifications</Text>
        <View style={{ width:50 }}/>
      </View>
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:32 }}>
        <Text style={{ fontSize:44, marginBottom:14 }}>🔔</Text>
        <Text style={{ fontSize:18, fontWeight:'700', color:theme.text, marginBottom:10 }}>No notifications yet</Text>
        <Text style={{ fontSize:14, color:theme.text3, textAlign:'center', lineHeight:22, marginBottom:24 }}>When someone responds to your request, sends an offer, or messages you — you'll see it here.</Text>
        <View style={{ backgroundColor:theme.card, borderRadius:14, padding:16, width:'100%', borderWidth:0.5, borderColor:theme.brand+'40' }}>
          <Text style={{ fontSize:13, fontWeight:'700', color:theme.brand, marginBottom:6 }}>⚡ Push notifications coming soon</Text>
          <Text style={{ fontSize:12, color:theme.text3, lineHeight:18 }}>We are launching real-time push alerts so you never miss a response.</Text>
        </View>
      </View>
    </View>
  );
}
