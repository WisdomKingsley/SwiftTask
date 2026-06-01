import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [image, setImage] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('userPhone').then(p => setPhone(p||''));
    AsyncStorage.getItem('userName').then(n => setName(n||''));
  }, []);

  const pickImage = async () => {
    const {status}=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status!=='granted'){Alert.alert('Permission needed','Allow access to your photos.');return;}
    const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,allowsEditing:true,aspect:[1,1],quality:0.8});
    if (!r.canceled) setImage(r.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name.trim()){Alert.alert('Required','Name cannot be empty');return;}
    setSaving(true);
    try {
      if (phone) await updateDoc(doc(db,'users',phone),{name:name.trim(),email:email.trim().toLowerCase(),bio:bio.trim(),location:{area:location.trim(),lat:6.5244,lng:3.3792}});
      await AsyncStorage.setItem('userName',name.trim());
      Alert.alert('Saved!','Profile updated successfully.',[{text:'OK',onPress:()=>router.back()}]);
    } catch { Alert.alert('Error','Could not save. Check your connection.'); }
    finally { setSaving(false); }
  };

  const F = ({ label, children }: any) => (
    <View style={{ marginBottom:16 }}>
      <Text style={{ fontSize:12, color:theme.text3, marginBottom:7, fontWeight:'500' }}>{label}</Text>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={()=>router.back()}><Text style={{ color:theme.text3, fontSize:15 }}>Cancel</Text></TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}><Text style={{ color:theme.brand, fontSize:15, fontWeight:'700', opacity:saving?0.5:1 }}>{saving?'Saving...':'Save'}</Text></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:16 }} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={{ alignItems:'center', paddingVertical:24 }} onPress={()=>Alert.alert('Change Photo','',[ {text:'Choose from Library',onPress:pickImage},{text:'Cancel',style:'cancel'}])}>
          {image
            ? <Image source={{uri:image}} style={{ width:100,height:100,borderRadius:50 }}/>
            : <View style={{ width:100,height:100,borderRadius:50,backgroundColor:theme.brand+'25',alignItems:'center',justifyContent:'center' }}>
                <Text style={{ fontSize:38,fontWeight:'800',color:theme.brand }}>{name?name[0].toUpperCase():'?'}</Text>
              </View>}
          <View style={{ position:'absolute',bottom:18,right:'34%',width:32,height:32,borderRadius:16,backgroundColor:theme.brand,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:theme.bg }}>
            <Text style={{ fontSize:16 }}>📷</Text>
          </View>
          <Text style={{ fontSize:13,color:theme.brand,marginTop:10,fontWeight:'600' }}>Tap to change photo</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor:theme.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:0.5,borderColor:theme.border }}>
          <Text style={{ fontSize:11,color:theme.text3,textTransform:'uppercase',letterSpacing:0.6,marginBottom:16 }}>Personal Information</Text>
          <F label="Full Name *">
            <TextInput style={{ backgroundColor:theme.bg,borderRadius:10,padding:14,fontSize:14,color:theme.text,borderWidth:0.5,borderColor:theme.border }} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={theme.text3} autoCapitalize="words"/>
          </F>
          <F label="Email Address">
            <TextInput style={{ backgroundColor:theme.bg,borderRadius:10,padding:14,fontSize:14,color:theme.text,borderWidth:0.5,borderColor:theme.border }} value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={theme.text3} keyboardType="email-address" autoCapitalize="none"/>
          </F>
          <F label="Phone Number">
            <View style={{ backgroundColor:theme.bg,borderRadius:10,padding:14,borderWidth:0.5,borderColor:theme.border,opacity:0.5 }}>
              <Text style={{ color:theme.text3,fontSize:14 }}>{phone||'Not set'}</Text>
            </View>
            <Text style={{ fontSize:11,color:theme.text3,marginTop:4 }}>Phone number cannot be changed</Text>
          </F>
          <F label="Your Area / Location">
            <TextInput style={{ backgroundColor:theme.bg,borderRadius:10,padding:14,fontSize:14,color:theme.text,borderWidth:0.5,borderColor:theme.border }} value={location} onChangeText={setLocation} placeholder="e.g. Lekki Phase 1, Lagos" placeholderTextColor={theme.text3}/>
          </F>
        </View>

        <View style={{ backgroundColor:theme.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:0.5,borderColor:theme.border }}>
          <Text style={{ fontSize:11,color:theme.text3,textTransform:'uppercase',letterSpacing:0.6,marginBottom:16 }}>About You</Text>
          <TextInput style={{ backgroundColor:theme.bg,borderRadius:10,padding:14,fontSize:14,color:theme.text,borderWidth:0.5,borderColor:theme.border,minHeight:100,textAlignVertical:'top' }} value={bio} onChangeText={setBio} placeholder="Tell providers a bit about yourself (optional)" placeholderTextColor={theme.text3} multiline numberOfLines={4}/>
        </View>

        <View style={{ backgroundColor:theme.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:0.5,borderColor:theme.border }}>
          <Text style={{ fontSize:11,color:theme.text3,textTransform:'uppercase',letterSpacing:0.6,marginBottom:4 }}>Account Actions</Text>
          <TouchableOpacity style={{ paddingVertical:14,borderBottomWidth:0.5,borderBottomColor:theme.border }}>
            <Text style={{ fontSize:14,color:theme.text3 }}>Deactivate Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ paddingVertical:14 }}>
            <Text style={{ fontSize:14,color:theme.red }}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height:40 }}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
