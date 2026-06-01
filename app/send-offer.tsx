import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function SendOffer() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { jobTitle } = useLocalSearchParams<{ jobTitle: string }>();
  const [price, setPrice] = useState('');
  const [eta, setEta] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!price || !eta) { Alert.alert('Error', 'Please enter your price and ETA'); return; }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      Alert.alert('Offer Sent! 🎉', 'The customer will be notified of your offer. They\'ll reply shortly.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1000);
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top, backgroundColor: theme.bg }]}>
      <View style={[styles.header, {backgroundColor:theme.bg, borderBottomColor:theme.border}]}>
        <TouchableOpacity onPress={() => router.back()}><Text style={[styles.back, {color:theme.brand}]}>← Back</Text></TouchableOpacity>
        <Text style={[styles.title, {color:theme.text}]}>Send Offer</Text>
        <View style={{ width: 50 }} />
      </View>
      <View style={[styles.content, {backgroundColor:theme.bg}]}>
        <View style={[styles.jobCard, {backgroundColor:theme.card, borderColor:theme.border}]}>
          <Text style={[styles.jobLabel, {color:theme.brand}]}>Job Request</Text>
          <Text style={[styles.jobTitle, {color:theme.text}]}>{jobTitle || 'Job Request'}</Text>
        </View>
        <Text style={[styles.fieldLabel, {color:theme.text}]}>Your Price (₦)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 8500"
          placeholderTextColor="#555"
          keyboardType="number-pad"
        />
        <Text style={[styles.fieldLabel, {color:theme.text}]}>Estimated Arrival (minutes)</Text>
        <TextInput
          style={styles.input}
          value={eta}
          onChangeText={setEta}
          placeholder="e.g. 25"
          placeholderTextColor="#555"
          keyboardType="number-pad"
        />
        <Text style={[styles.fieldLabel, {color:theme.text}]}>Message to Customer</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Introduce yourself and explain your offer..."
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
        />
        {price && eta && (
          <View style={[styles.preview, {backgroundColor:theme.card, borderColor:theme.border}]}>
            <Text style={[styles.previewLabel, {color:theme.text3}]}>Offer Preview</Text>
            <Text style={[styles.previewPrice, {color:theme.brand}]}>₦{parseInt(price).toLocaleString()}</Text>
            <Text style={[styles.previewEta, {color:theme.text3}]}>ETA ~{eta} mins</Text>
          </View>
        )}
        <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.7 }]} onPress={handleSend} disabled={sending}>
          <Text style={[styles.sendTxt, {color:"#fff"}]}>{sending ? 'Sending...' : 'Send Offer →'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#2A2A38' },
  back: { color: '#FF5C00', fontSize: 15 },
  title: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  content: { padding: 16 },
  jobCard: { backgroundColor: '#1A1A22', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: '#2A2A38' },
  jobLabel: { fontSize: 11, color: '#FF5C00', fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  jobTitle: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  fieldLabel: { fontSize: 12, color: '#888', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: '#1A1A22', borderRadius: 10, padding: 13, fontSize: 15, color: '#FFFFFF', borderWidth: 0.5, borderColor: '#2A2A38' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  preview: { backgroundColor: '#FF5C0015', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 0.5, borderColor: '#FF5C0040', alignItems: 'center' },
  previewLabel: { fontSize: 11, color: '#FF5C00', fontWeight: '700', marginBottom: 6 },
  previewPrice: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  previewEta: { fontSize: 13, color: '#888', marginTop: 4 },
  sendBtn: { backgroundColor: '#FF5C00', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  sendTxt: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
