import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const SECTIONS = [
  {title:'Information We Collect',body:'We collect your phone number, name, email address (optional), and location data. We also collect usage data to improve our services.'},
  {title:'How We Use Your Information',body:'Your information is used to provide the SwiftTask service, match you with nearby providers or customers, process payments, and improve our platform.'},
  {title:'Location Data',body:'We use your GPS location to show you nearby service providers and to show providers nearby job requests. Location data is only shared with relevant parties during an active job.'},
  {title:'Data Sharing',body:'We do not sell your personal data. We share data with Paystack for payment processing and Firebase for data storage. Both comply with applicable data protection laws.'},
  {title:'Data Security',body:'Your data is encrypted in transit and at rest. We use Firebase security rules to ensure only authorized access to your data.'},
  {title:'Your Rights',body:'You can request deletion of your account and data at any time via Profile → Edit Profile → Delete Account. We will process your request within 30 days.'},
  {title:'NDPR Compliance',body:'SwiftTask complies with the Nigeria Data Protection Regulation (NDPR). We are registered with NITDA as a data controller.'},
  {title:'Contact',body:'For privacy inquiries, contact hello@swifttask.ng'},
];

export default function PrivacyPolicy() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Privacy Policy</Text>
        <View style={{ width:50 }}/>
      </View>
      <ScrollView contentContainerStyle={{ padding:20 }}>
        <Text style={{ fontSize:12, color:theme.text3, marginBottom:20 }}>Last updated: January 2026</Text>
        {SECTIONS.map((s,i)=>(
          <View key={i} style={{ marginBottom:20 }}>
            <Text style={{ fontSize:15, fontWeight:'700', color:theme.text, marginBottom:8 }}>{s.title}</Text>
            <Text style={{ fontSize:13, color:theme.text2, lineHeight:21 }}>{s.body}</Text>
          </View>
        ))}
        <View style={{ height:40 }}/>
      </ScrollView>
    </View>
  );
}
