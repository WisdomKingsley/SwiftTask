import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function MyJobs() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>My Jobs</Text>
        <View style={{ width:50 }}/>
      </View>
      <View style={{ backgroundColor:theme.brand+'15', margin:16, borderRadius:14, padding:16, borderWidth:0.5, borderColor:theme.brand+'40', alignItems:'center' }}>
        <Text style={{ fontSize:12, color:theme.brand, fontWeight:'600', marginBottom:4 }}>Total Earned</Text>
        <Text style={{ fontSize:32, fontWeight:'800', color:theme.text }}>₦0</Text>
        <Text style={{ fontSize:12, color:theme.text3, marginTop:4 }}>Complete your first job to start earning</Text>
      </View>
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:32 }}>
        <Text style={{ fontSize:44, marginBottom:14 }}>💼</Text>
        <Text style={{ fontSize:18, fontWeight:'700', color:theme.text, marginBottom:10 }}>No completed jobs yet</Text>
        <Text style={{ fontSize:14, color:theme.text3, textAlign:'center', lineHeight:22, marginBottom:24 }}>When you accept and complete a job, it will appear here with your earnings.</Text>
        <TouchableOpacity style={{ backgroundColor:theme.brand, borderRadius:12, paddingHorizontal:24, paddingVertical:12 }} onPress={()=>router.back()}>
          <Text style={{ color:'#fff', fontSize:14, fontWeight:'700' }}>Find Jobs →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
