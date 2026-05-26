import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, Route, ShieldCheck, Sprout } from 'lucide-react-native';
import { BackHeader, Card, PrimaryButton, Screen, palette } from '@/components/kirsof';

const STEPS = [
  {
    title: 'Discover',
    body: 'Browse products or explore farms on the map. Filter by category, price, or location.',
  },
  {
    title: 'Order',
    body: 'Add items from local producers, choose pickup, courier, or cargo, and pay in the app.',
  },
  {
    title: 'Enjoy',
    body: 'Receive fresh produce, rate the experience, and keep money closer to farmers.',
  },
];

const TEAM = [
  { name: 'Alperen Civici', id: '220205009' },
  { name: 'Tahsin Cemal Sakin', id: '220205018' },
  { name: 'Serdar Bulut', id: '220201011' },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerPad}>
          <BackHeader title="Our Story" subtitle="How Kirsof connects farms and homes" />
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Farmers earn fairly. Consumers know the source.</Text>
          <Text style={styles.heroText}>
            Kirsof was built around a simple idea: Turkey&apos;s small-scale farmers should not lose
            most of their income to intermediaries, and buyers should not have to guess where food
            comes from.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionKicker}>Mission</Text>
          <Text style={styles.sectionTitle}>A direct digital bridge for local agriculture</Text>
          <Text style={styles.paragraph}>
            Traditional agricultural supply chains can separate farmers from fair margins and
            consumers from transparency. Kirsof shortens that chain with marketplace listings,
            farm profiles, map discovery, order tracking, reviews, and tax-aware checkout.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>4%</Text>
            <Text style={styles.statText}>withholding tax, no platform fee</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>24h</Text>
            <Text style={styles.statText}>freshness-focused delivery goal</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statText}>middlemen between buyer and farmer</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>96%</Text>
            <Text style={styles.statText}>seller revenue after tax</Text>
          </Card>
        </View>

        <View style={styles.darkSection}>
          <Text style={styles.darkTitle}>How Kirsof works</Text>
          {STEPS.map((step, index) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.goalGrid}>
          <Card style={styles.goal}>
            <Leaf size={24} color="#b91c1c" />
            <Text style={styles.goalTitle}>SDG 8</Text>
            <Text style={styles.goalText}>Raises farmer income through direct selling.</Text>
          </Card>
          <Card style={styles.goal}>
            <Route size={24} color="#ea580c" />
            <Text style={styles.goalTitle}>SDG 9</Text>
            <Text style={styles.goalText}>Brings modern digital tools into agriculture.</Text>
          </Card>
          <Card style={styles.goal}>
            <ShieldCheck size={24} color="#047857" />
            <Text style={styles.goalTitle}>SDG 12</Text>
            <Text style={styles.goalText}>Shortens the route from field to table.</Text>
          </Card>
        </View>

        <View style={styles.teamSection}>
          <Text style={styles.sectionTitle}>The Team</Text>
          <Text style={styles.paragraph}>
            Developed as a graduation project at Ankara Science University, Department of
            Information Science and Computer Engineering.
          </Text>
          {TEAM.map((member) => (
            <Card key={member.id} style={styles.memberCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberId}>{member.id}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.cta}>
          <Sprout size={28} color="#fff" />
          <Text style={styles.ctaTitle}>Ready to support local farmers?</Text>
          <Text style={styles.ctaText}>Join Kirsof or browse the market right away.</Text>
          <View style={styles.ctaActions}>
            <PrimaryButton label="Create Account" tone="light" onPress={() => router.push('/(auth)/signup')} style={styles.ctaButton} />
            <TouchableOpacity style={styles.marketButton} onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.marketText}>Browse Market</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hero: {
    marginHorizontal: 16,
    backgroundColor: palette.emerald,
    borderRadius: 22,
    padding: 24,
    marginBottom: 22,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
  },
  heroText: {
    color: '#d1fae5',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionKicker: {
    color: palette.emeraldDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    marginBottom: 10,
  },
  paragraph: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 23,
  },
  statsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  stat: {
    width: '48%',
    marginBottom: 12,
    minHeight: 130,
  },
  statValue: {
    color: palette.emeraldDark,
    fontSize: 32,
    fontWeight: '900',
  },
  statText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  darkSection: {
    backgroundColor: '#111827',
    padding: 20,
    marginBottom: 22,
  },
  darkTitle: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
  },
  stepBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#6ee7b7',
    fontWeight: '900',
  },
  stepTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  stepText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  goalGrid: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  goal: {
    marginBottom: 12,
  },
  goalTitle: {
    color: palette.text,
    fontWeight: '900',
    fontSize: 17,
    marginTop: 10,
  },
  goalText: {
    color: palette.muted,
    lineHeight: 21,
    marginTop: 4,
  },
  teamSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: palette.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  memberName: {
    color: palette.text,
    fontWeight: '900',
  },
  memberId: {
    color: palette.muted,
    marginTop: 2,
  },
  cta: {
    marginHorizontal: 16,
    backgroundColor: palette.emeraldDark,
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 12,
  },
  ctaText: {
    color: '#d1fae5',
    fontSize: 14,
    marginTop: 6,
  },
  ctaActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  ctaButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  marketButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketText: {
    color: '#fff',
    fontWeight: '900',
  },
});
