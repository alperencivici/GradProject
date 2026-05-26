import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { money, roleColors, statusColors, statusLabel } from '@/lib/format';

export const palette = {
  bg: '#f8faf9',
  surface: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  faint: '#f3f4f6',
  border: '#e5e7eb',
  emerald: '#10b981',
  emeraldDark: '#047857',
  amber: '#d97706',
  red: '#dc2626',
  blue: '#2563eb',
  purple: '#7e22ce',
};

export function Screen({
  children,
  padded = true,
  style,
}: {
  children: React.ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top']}>
      <View style={[styles.screenInner, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

export function BackHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={styles.backHeader}>
      <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
        <ChevronLeft size={24} color={palette.text} />
      </TouchableOpacity>
      <View style={styles.headerTitleWrap}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.pageTitle}>
      <Text style={styles.pageTitleText}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = 'emerald',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'emerald' | 'light' | 'danger' | 'amber' | 'purple';
  style?: StyleProp<ViewStyle>;
}) {
  const tones = {
    emerald: { bg: palette.emerald, text: '#fff', border: palette.emerald },
    light: { bg: '#f3f4f6', text: '#374151', border: '#f3f4f6' },
    danger: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
    amber: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    purple: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
  };
  const selected = tones[tone];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.primaryButton,
        { backgroundColor: selected.bg, borderColor: selected.border },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.primaryButtonText, { color: selected.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Input({
  label,
  multiline,
  style,
  inputStyle,
  ...props
}: TextInputProps & {
  label?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={[styles.inputGroup, style]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea, inputStyle]}
        {...props}
      />
    </View>
  );
}

export function SearchInput({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#9ca3af"
      style={[styles.searchInput, style]}
      {...props}
    />
  );
}

export function Tabs({
  value,
  tabs,
  onChange,
}: {
  value: string;
  tabs: { value: string; label: string }[];
  onChange: (value: any) => void;
}) {
  return (
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.value)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function StatusPill({ status }: { status: string }) {
  const colors = statusColors(status);
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.pillText, { color: colors.text }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function RolePill({ role }: { role: string }) {
  const colors = roleColors(role);
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.pillText, { color: colors.text }]}>{role || 'unknown'}</Text>
    </View>
  );
}

export function StatCard({
  label,
  value,
  tone = palette.text,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: tone }]} numberOfLines={1}>
        {value}
      </Text>
    </Card>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={3}>
        {value || 'Not set'}
      </Text>
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={palette.emerald} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function ProductThumb({
  uri,
  size = 72,
}: {
  uri?: string | null;
  size?: number;
}) {
  return (
    <View style={[styles.thumb, { width: size, height: size }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.thumbImage} />
      ) : (
        <Text style={styles.thumbFallback}>Fresh</Text>
      )}
    </View>
  );
}

export function ProductCard({
  product,
  onPress,
  compact,
}: {
  product: any;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.productCard, compact && styles.productCardCompact]} onPress={onPress}>
      <ProductThumb uri={product.image_url} size={compact ? 64 : 120} />
      <View style={styles.productBody}>
        <Text style={styles.productFarmer} numberOfLines={1}>
          {product.profiles?.full_name || product.farmer_name || 'Farmer'}
        </Text>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        {compact ? null : (
          <Text style={styles.productDesc} numberOfLines={2}>
            {product.description || 'Fresh local product'}
          </Text>
        )}
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{money(product.price)}</Text>
          <Text style={styles.productUnit}>/ kg</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  screenInner: {
    flex: 1,
  },
  padded: {
    padding: 16,
  },
  backHeader: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 2,
  },
  headerRight: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  pageTitle: {
    marginBottom: 16,
  },
  pageTitleText: {
    fontSize: 30,
    fontWeight: '900',
    color: palette.text,
    letterSpacing: 0,
  },
  pageSubtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef2f1',
    padding: 16,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    color: palette.text,
    fontSize: 15,
  },
  textarea: {
    minHeight: 92,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    color: palette.text,
    fontSize: 15,
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#eef2f1',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabActive: {
    backgroundColor: palette.surface,
  },
  tabText: {
    color: '#64748b',
    fontWeight: '800',
    fontSize: 12,
  },
  tabTextActive: {
    color: palette.text,
  },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 8,
  },
  chipActive: {
    borderColor: palette.emerald,
    backgroundColor: palette.emerald,
  },
  chipText: {
    color: '#475569',
    fontWeight: '800',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
  },
  statLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  infoValue: {
    flex: 1,
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 18,
    minWidth: 180,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: palette.muted,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '700',
  },
  thumb: {
    backgroundColor: '#eef2f1',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    color: palette.emeraldDark,
    fontSize: 12,
    fontWeight: '900',
  },
  productCard: {
    width: '48%',
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef2f1',
    marginBottom: 14,
    overflow: 'hidden',
  },
  productCardCompact: {
    width: '100%',
    flexDirection: 'row',
    padding: 12,
  },
  productBody: {
    flex: 1,
    padding: 12,
  },
  productFarmer: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  productName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
  productDesc: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 5,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  productPrice: {
    color: palette.emeraldDark,
    fontSize: 15,
    fontWeight: '900',
  },
  productUnit: {
    color: palette.muted,
    fontSize: 11,
    marginLeft: 3,
  },
});
