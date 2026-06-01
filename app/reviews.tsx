import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

const RATING_CONFIG = [
  { stars: 5, label: 'Perfect — Job Done ✅',     color: '#2ECC71', desc: 'Exceptional work. Would hire again without hesitation.' },
  { stars: 4, label: 'Good',                       color: '#27AE60', desc: 'Solid job. Minor things could be better.' },
  { stars: 3, label: 'Issues Encountered ⚠️',      color: '#F59E0B', desc: 'Job done but with problems along the way.' },
  { stars: 2, label: 'Poor Experience',            color: '#E67E22', desc: 'Significant issues. Not what was promised.' },
  { stars: 1, label: 'Unacceptable ❌',            color: '#E74C3C', desc: 'Job not completed or provider was unprofessional.' },
];

export default function Reviews() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const activeRating = RATING_CONFIG.find(r => r.stars === rating);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('Select a rating', 'Please tap a star to rate'); return; }
    setSubmitting(true);
    try {
      const phone = await AsyncStorage.getItem('userPhone') || '';
      await addDoc(collection(db, 'reviews'), {
        reviewerId: phone,
        rating,
        label: activeRating?.label || '',
        comment: comment.trim(),
        ratingVersion: 2, // v2 = new calibrated scale
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setRating(0);
      setComment('');
      Alert.alert('Review submitted ⭐', 'Thank you. Your feedback helps the SwiftTask community.');
    } catch {
      Alert.alert('Error', 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex:1, backgroundColor:theme.bg, paddingTop:insets.top }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, borderBottomWidth:0.5, borderBottomColor:theme.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color:theme.brand, fontSize:15 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize:17, fontWeight:'700', color:theme.text }}>Reviews</Text>
        <View style={{ width:50 }}/>
      </View>

      {/* Rating scale explainer */}
      <View style={{ backgroundColor:theme.card, margin:16, borderRadius:14, padding:14, borderWidth:0.5, borderColor:theme.border }}>
        <Text style={{ fontSize:12, fontWeight:'700', color:theme.text3, textTransform:'uppercase', letterSpacing:0.6, marginBottom:12 }}>SwiftTask Rating Scale</Text>
        {RATING_CONFIG.map(r => (
          <View key={r.stars} style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 }}>
            <View style={{ flexDirection:'row', gap:1 }}>
              {[1,2,3,4,5].map(s => (
                <Text key={s} style={{ fontSize:12, color: s <= r.stars ? r.color : theme.border }}>★</Text>
              ))}
            </View>
            <Text style={{ fontSize:12, fontWeight:'600', color:r.color, flex:1 }}>{r.label}</Text>
          </View>
        ))}
        <View style={{ marginTop:6, backgroundColor:theme.bg3, borderRadius:8, padding:10 }}>
          <Text style={{ fontSize:11, color:theme.text3, lineHeight:16 }}>
            ⚠️ 3 stars and below indicates a problem. Providers below 3.5 average are reviewed by SwiftTask admin and may be suspended.
          </Text>
        </View>
      </View>

      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:32 }}>
        <Text style={{ fontSize:44, marginBottom:14 }}>⭐</Text>
        <Text style={{ fontSize:18, fontWeight:'700', color:theme.text, marginBottom:10 }}>No reviews yet</Text>
        <Text style={{ fontSize:14, color:theme.text3, textAlign:'center', lineHeight:22, marginBottom:24 }}>
          Reviews appear after completed jobs. Honest ratings protect the community.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor:theme.brand, borderRadius:12, paddingHorizontal:24, paddingVertical:12 }}
          onPress={() => setShowModal(true)}>
          <Text style={{ color:'#fff', fontSize:14, fontWeight:'700' }}>Leave a Review</Text>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:theme.card, borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, paddingBottom:40 }}>
            <View style={{ width:40, height:4, backgroundColor:theme.border, borderRadius:2, alignSelf:'center', marginBottom:20 }}/>
            <Text style={{ fontSize:20, fontWeight:'800', color:theme.text, marginBottom:4 }}>Rate this job</Text>
            <Text style={{ fontSize:13, color:theme.text3, marginBottom:20 }}>Your honest rating helps maintain quality on SwiftTask.</Text>

            {/* Stars */}
            <View style={{ flexDirection:'row', justifyContent:'center', gap:10, marginBottom:10 }}>
              {[1,2,3,4,5].map(star => {
                const cfg = RATING_CONFIG.find(r => r.stars === star)!;
                const isActive = star <= rating;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}>
                    <Text style={{ fontSize:42, color: isActive ? cfg.color : theme.border }}>★</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Rating label */}
            {rating > 0 && activeRating && (
              <View style={{ alignItems:'center', marginBottom:16 }}>
                <Text style={{ fontSize:16, fontWeight:'800', color:activeRating.color, marginBottom:4 }}>
                  {activeRating.label}
                </Text>
                <Text style={{ fontSize:12, color:theme.text3, textAlign:'center' }}>
                  {activeRating.desc}
                </Text>
              </View>
            )}

            {/* Warning for low ratings */}
            {rating > 0 && rating <= 3 && (
              <View style={{ backgroundColor:theme.amber+'15', borderRadius:10, padding:12, marginBottom:14, borderWidth:0.5, borderColor:theme.amber+'40' }}>
                <Text style={{ fontSize:12, color:theme.amber, lineHeight:18 }}>
                  ⚠️ A rating of {rating} star{rating > 1 ? 's' : ''} will flag this provider for admin review. Please describe the issue clearly below.
                </Text>
              </View>
            )}

            <TextInput
              style={{ backgroundColor:theme.bg, borderRadius:10, padding:14, fontSize:14, color:theme.text, borderWidth:0.5, borderColor:theme.border, minHeight:100, textAlignVertical:'top', marginBottom:20 }}
              placeholder={rating <= 3 && rating > 0 ? "Please describe what went wrong..." : "Tell others about your experience (optional)"}
              placeholderTextColor={theme.text3}
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity
                style={{ flex:1, backgroundColor:theme.bg3, borderRadius:10, padding:14, alignItems:'center' }}
                onPress={() => { setShowModal(false); setRating(0); setComment(''); }}>
                <Text style={{ color:theme.text3, fontSize:14, fontWeight:'600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex:2, backgroundColor:theme.brand, borderRadius:10, padding:14, alignItems:'center', opacity: rating===0||submitting ? 0.5 : 1 }}
                onPress={handleSubmit}
                disabled={rating===0||submitting}>
                <Text style={{ color:'#fff', fontSize:14, fontWeight:'700' }}>
                  {submitting ? 'Submitting...' : 'Submit Review →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
