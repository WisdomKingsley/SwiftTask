import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function Performance() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Performance</Text>
        <View style={{ width:50 }}/>
      </View>
      <ScrollView contentContainerStyle={{ padding:16 }}>
        <View style={{ backgroundColor:theme.card, borderRadius:16, padding:24, alignItems:'center', marginBottom:16, borderWidth:0.5, borderColor:theme.border }}>
          <Text style={{ fontSize:36, marginBottom:12 }}>📊</Text>
          <Text style={{ fontSize:18, fontWeight:'700', color:theme.text, marginBottom:8 }}>No data yet</Text>
          <Text style={{ fontSize:13, color:theme.text3, textAlign:'center', lineHeight:20 }}>Complete your first job to see your performance stats — response rate, completion rate, ratings, and earnings.</Text>
        </View>
        <View style={{ backgroundColor:theme.card, borderRadius:14, padding:16, borderWidth:0.5, borderColor:theme.border }}>
          <Text style={{ fontSize:14, fontWeight:'700', color:theme.text, marginBottom:12 }}>💡 Tips to rank higher</Text>
          {['Reply to job requests within 5 minutes','Always complete jobs on time','Ask customers to leave a review after each job','Keep your profile photo and skills updated','Stay online during peak hours (7am–10am and 5pm–9pm)'].map((tip,i)=>(
            <View key={i} style={{ flexDirection:'row', gap:8, marginBottom:10 }}>
              <Text style={{ color:theme.brand, fontSize:14, fontWeight:'700' }}>•</Text>
              <Text style={{ flex:1, fontSize:13, color:theme.text2, lineHeight:19 }}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
