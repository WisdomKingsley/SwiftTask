import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const CATEGORIES = ['Bug or technical issue','Fraudulent provider','Inappropriate content','Payment problem','Safety concern','Other'];

export default function ReportProblem() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [selected, setSelected] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selected) { Alert.alert('Required','Please select a category'); return; }
    if (!description.trim()) { Alert.alert('Required','Please describe the problem'); return; }
    Alert.alert('Report submitted','Thank you. Our team will review this within 24 hours.',[{text:'OK',onPress:()=>router.back()}]);
  };

  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Report a Problem</Text>
        <View style={{ width:50 }}/>
      </View>
      <ScrollView contentContainerStyle={{ padding:16 }}>
        <Text style={{ fontSize:13, color:theme.text3, marginBottom:20, lineHeight:19 }}>Help us keep SwiftTask safe and reliable. Reports are reviewed within 24 hours.</Text>
        <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, marginBottom:12 }}>Category *</Text>
        {CATEGORIES.map(cat=>(
          <TouchableOpacity key={cat} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:14, backgroundColor:theme.card, borderRadius:10, borderWidth:0.5, borderColor:selected===cat?theme.brand:theme.border, marginBottom:8 }} onPress={()=>setSelected(cat)}>
            <Text style={{ fontSize:14, color:theme.text }}>{cat}</Text>
            <View style={{ width:20, height:20, borderRadius:10, borderWidth:2, borderColor:selected===cat?theme.brand:theme.border, backgroundColor:selected===cat?theme.brand:'transparent', alignItems:'center', justifyContent:'center' }}>
              {selected===cat && <View style={{ width:8, height:8, borderRadius:4, backgroundColor:'#fff' }}/>}
            </View>
          </TouchableOpacity>
        ))}
        <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, marginBottom:8, marginTop:16 }}>Description *</Text>
        <TextInput style={{ backgroundColor:theme.card, borderRadius:10, padding:14, fontSize:14, color:theme.text, borderWidth:0.5, borderColor:theme.border, minHeight:120, textAlignVertical:'top' }} placeholder="Describe the problem in detail..." placeholderTextColor={theme.text3} value={description} onChangeText={setDescription} multiline/>
        <TouchableOpacity style={{ backgroundColor:theme.brand, borderRadius:12, padding:16, alignItems:'center', marginTop:24, opacity:!selected||!description.trim()?0.5:1 }} onPress={handleSubmit} disabled={!selected||!description.trim()}>
          <Text style={{ color:'#fff', fontSize:15, fontWeight:'700' }}>Submit Report</Text>
        </TouchableOpacity>
        <View style={{ height:40 }}/>
      </ScrollView>
    </View>
  );
}
