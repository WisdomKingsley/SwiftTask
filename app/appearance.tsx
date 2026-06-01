import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggle } = useTheme();

  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Appearance</Text>
        <View style={{ width:50 }}/>
      </View>

      <View style={{ padding:20 }}>
        <Text style={{ fontSize:13, color:theme.text3, marginBottom:24, lineHeight:19 }}>
          Choose how SwiftTask looks. Your preference is saved and applied across the entire app.
        </Text>

        {[
          { label:'🌙 Dark Mode', sub:'Easier on the eyes. Great for night-time use.', value:true },
          { label:'☀️ Light Mode', sub:'Bright and clear. Great for daytime use.', value:false },
        ].map(opt=>(
          <TouchableOpacity
            key={String(opt.value)}
            style={{ flexDirection:'row', alignItems:'center', padding:18, borderRadius:16, borderWidth: isDark===opt.value ? 2 : 0.5, borderColor: isDark===opt.value ? theme.brand : theme.border, backgroundColor:theme.card, marginBottom:14 }}
            onPress={()=>{ if(isDark!==opt.value) toggle(); }}
            activeOpacity={0.8}>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:16, fontWeight:'700', color:theme.text, marginBottom:4 }}>{opt.label}</Text>
              <Text style={{ fontSize:13, color:theme.text3 }}>{opt.sub}</Text>
            </View>
            <View style={{ width:24, height:24, borderRadius:12, borderWidth:2, borderColor: isDark===opt.value ? theme.brand : theme.border, alignItems:'center', justifyContent:'center', backgroundColor: isDark===opt.value ? theme.brand : 'transparent' }}>
              {isDark===opt.value && <View style={{ width:10, height:10, borderRadius:5, backgroundColor:'#fff' }}/>}
            </View>
          </TouchableOpacity>
        ))}

        {/* Live preview */}
        <Text style={{ fontSize:11, color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, marginBottom:12, marginTop:8 }}>Live Preview</Text>
        <View style={{ backgroundColor:theme.card, borderRadius:14, padding:16, borderWidth:0.5, borderColor:theme.border }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:12, backgroundColor:theme.bg, borderRadius:10, marginBottom:12 }}>
            <View style={{ width:40, height:40, borderRadius:20, backgroundColor:theme.brand+'30' }}/>
            <View style={{ flex:1, gap:6 }}>
              <View style={{ height:10, backgroundColor:theme.text, borderRadius:5, width:'65%', opacity:0.8 }}/>
              <View style={{ height:8, backgroundColor:theme.text3, borderRadius:4, width:'40%' }}/>
            </View>
          </View>
          <View style={{ backgroundColor:theme.brand, borderRadius:10, padding:12, alignItems:'center' }}>
            <Text style={{ color:'#fff', fontSize:13, fontWeight:'700' }}>Post a Request →</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
