import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const ARTICLES = [
  {
    icon: '📋',
    title: 'How to post a request',
    content: 'Tap "Post a Request" on the home screen. Describe what you need clearly, select the right category, set your urgency and budget, then tap Post. Nearby verified providers will respond with offers within minutes.',
  },
  {
    icon: '💰',
    title: 'How payments work',
    content: 'Currently in beta, payment is agreed between you and the provider in chat. Full escrow payments via Paystack are coming soon — funds will be held safely until you confirm the job is done.',
  },
  {
    icon: '⭐',
    title: 'Ratings and reviews',
    content: 'After every job, both parties can leave a review. Honest ratings help the community. Providers with higher ratings appear higher in search results. You cannot edit a review after submitting.',
  },
  {
    icon: '🛡️',
    title: 'Safety on SwiftTask',
    content: 'All providers are phone-verified. Never share personal financial information in chat. If a provider asks for payment outside the app, report them immediately. Your safety is our top priority.',
  },
  {
    icon: '🔧',
    title: 'How to cancel a request',
    content: 'Go to My Requests, find the request you want to cancel, and tap Manage. You can cancel any open request before a provider has been hired. Once a job is in progress, contact support.',
  },
  {
    icon: '🚩',
    title: 'How to report a problem',
    content: 'Go to Profile → Report a Problem, or email hello@swifttask.ng. For urgent safety issues, end the job immediately and contact us. We respond within a few hours during business hours.',
  },
];

export default function HelpSupport() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.brand, fontSize: 15 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>Help & Support</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: theme.brand + '18', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 0.5, borderColor: theme.brand + '40' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.brand, marginBottom: 4 }}>Need help fast?</Text>
          <Text style={{ fontSize: 13, color: theme.text2, marginBottom: 14, lineHeight: 19 }}>
            Our team responds within a few hours. Reach us directly:
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: theme.brand, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 }}
            onPress={() => Linking.openURL('mailto:hello@swifttask.ng')}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>📧 hello@swifttask.ng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: theme.bg3, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: theme.border }}
            onPress={() => Linking.openURL('https://wa.me/2340000000000')}>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>💬 WhatsApp Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 11, color: theme.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Common Questions</Text>

        {ARTICLES.map((article, i) => (
          <TouchableOpacity
            key={i}
            style={{ backgroundColor: theme.card, borderRadius: 12, marginBottom: 8, borderWidth: 0.5, borderColor: expanded === i ? theme.brand : theme.border, overflow: 'hidden' }}
            onPress={() => setExpanded(expanded === i ? null : i)}
            activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
              <Text style={{ fontSize: 20 }}>{article.icon}</Text>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.text }}>{article.title}</Text>
              <Text style={{ fontSize: 18, color: theme.text3 }}>{expanded === i ? '−' : '+'}</Text>
            </View>
            {expanded === i && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 0 }}>
                <View style={{ height: 0.5, backgroundColor: theme.border, marginBottom: 12 }} />
                <Text style={{ fontSize: 13, color: theme.text2, lineHeight: 20 }}>{article.content}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ marginTop: 8, backgroundColor: theme.card, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: theme.border }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 4 }}>Still need help?</Text>
          <Text style={{ fontSize: 12, color: theme.text3, lineHeight: 18 }}>
            Can't find what you're looking for? Email us at hello@swifttask.ng and we'll get back to you within a few hours.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
