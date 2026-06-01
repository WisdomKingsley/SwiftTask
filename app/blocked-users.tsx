import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function BlockedUsers() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Blocked Users</Text>
        <View style={{ width:50 }}/>
      </View>
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:32 }}>
        <Text style={{ fontSize:44, marginBottom:14 }}>🚫</Text>
        <Text style={{ fontSize:18, fontWeight:'700', color:theme.text, marginBottom:10 }}>No blocked users</Text>
        <Text style={{ fontSize:14, color:theme.text3, textAlign:'center', lineHeight:22 }}>Users you block will appear here. They will not be able to contact you or see your requests.</Text>
      </View>
    </View>
  );
}
