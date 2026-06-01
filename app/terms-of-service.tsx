import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const SECTIONS = [
  {title:'1. Acceptance of Terms',body:'By downloading or using SwiftTask, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.'},
  {title:'2. Description of Service',body:'SwiftTask is a marketplace platform that connects customers with local service providers in Nigeria. We facilitate connections but are not responsible for the quality of services provided by third-party providers.'},
  {title:'3. User Accounts',body:'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account. You must be at least 18 years old to use SwiftTask.'},
  {title:'4. Provider Conduct',body:'Providers must deliver services as described and agreed upon. Fraudulent activity, misrepresentation of skills, or abusive behavior will result in immediate account termination.'},
  {title:'5. Payments',body:'SwiftTask charges a 10% commission on completed transactions. All payments are processed securely via Paystack. SwiftTask is not responsible for disputes arising from cash transactions outside the platform.'},
  {title:'6. Dispute Resolution',body:'SwiftTask provides a dispute resolution mechanism for transactions processed through our platform. We reserve the right to make final decisions on unresolved disputes.'},
  {title:'7. Termination',body:'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or harm the SwiftTask community.'},
  {title:'8. Contact',body:'For questions about these Terms, contact us at hello@swifttask.ng'},
];

export default function TermsOfService() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Terms of Service</Text>
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
