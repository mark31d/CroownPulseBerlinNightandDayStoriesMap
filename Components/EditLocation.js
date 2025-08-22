// Components/EditLocation.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { setOverride } from './spotsOverrides';

const COLORS = {
  bg:      '#0D0A1F',   // тёмный фиолетовый фон
  text:    '#EDEBFF',   // основной текст
  muted:   '#B7B5E8',   // подписи / плейсхолдеры
  field:   '#1C1536',   // фон инпутов
  border:  '#2C2255',   // границы/разделители
  primary: '#7C3AED',   // основной акцент
  accent:  '#A78BFA',   // дополнительный акцент
  white:   '#FFFFFF',
};

const CAT_SUGGESTIONS = [
  { label: '🏛️ Historical' },
  { label: '🎨 Art & Design' },
  { label: '🎉 Entertainment' },
  { label: '🎭 People & Moments' },
  { label: '🌃 Night / City' },
  { label: '📎 Other' },
];

export default function EditLocation({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const spot = route?.params?.spot || {};

  const initial = useMemo(() => ({
    title: spot.title || '',
    description: spot.description || '',
    categoryLabel: spot.categoryLabel || '',
    rating: String(spot.rating ?? ''),
  }), [spot]);

  const [title, setTitle]             = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [categoryLabel, setCategory]  = useState(initial.categoryLabel);
  const [rating, setRating]           = useState(initial.rating);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    navigation.setOptions?.({ headerShown: false });
  }, [navigation]);

  // есть ли изменения
  const dirty = useMemo(() => {
    const r1 = (rating || '').trim();
    const r0 = (initial.rating || '').trim();
    return (
      (title || '').trim()          !== (initial.title || '').trim() ||
      (description || '').trim()    !== (initial.description || '').trim() ||
      (categoryLabel || '').trim()  !== (initial.categoryLabel || '').trim() ||
      r1 !== r0
    );
  }, [title, description, categoryLabel, rating, initial]);

  // нормализация рейтинга 0–5, 1 знак после запятой
  const normalizeRating = (val) => {
    if (!val) return '';
    const raw = parseFloat(String(val).replace(',', '.'));
    if (Number.isNaN(raw)) return '';
    const clamped = Math.max(0, Math.min(5, raw));
    return String(Math.round(clamped * 10) / 10);
  };

  const onRatingBlur = () => setRating(prev => normalizeRating(prev));

  const onSave = async () => {
    if (saving) return;
    if (!dirty) return;
    if (!spot?.id) {
      Alert.alert('Edit', 'Cannot edit: spot has no id');
      return;
    }
    setSaving(true);

    const patch = {
      title: (title || '').trim() || spot.title,
      description: (description || '').trim() || spot.description,
      categoryLabel: (categoryLabel || '').trim() || spot.categoryLabel,
    };
    const r = parseFloat(normalizeRating(rating));
    if (!Number.isNaN(r)) patch.rating = r;

    const ok = await setOverride(spot.id, patch);
    setSaving(false);

    if (!ok) {
      Alert.alert('Error', 'Failed to save changes');
      return;
    }
    navigation.goBack();
  };

  const onReset = () => {
    setTitle(initial.title);
    setDescription(initial.description);
    setCategory(initial.categoryLabel);
    setRating(initial.rating);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top','left','right']}>
      {/* Header */}
      <View style={[styles.headerRow, { paddingHorizontal: 14 + insets.left }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={10}>
          <Image source={require('../assets/back.webp')} style={[styles.headerIcon, { tintColor: COLORS.accent }]} />
        </Pressable>

        <Text style={styles.headerTitle}>Edit</Text>

        <Pressable
          onPress={onSave}
          disabled={!dirty || saving}
          style={[
            styles.headerBtn,
            styles.headerBtnPrimary,
            { opacity: !dirty || saving ? 0.5 : 1 },
          ]}
          hitSlop={10}
        >
          <Image source={require('../assets/check.webp')} style={[styles.headerIcon, { tintColor: COLORS.white }]} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Category</Text>
        <TextInput
          value={categoryLabel}
          onChangeText={setCategory}
          placeholder="Category"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />
        {/* Быстрые чипы категорий */}
        <View style={styles.chipsRow}>
          {CAT_SUGGESTIONS.map((c) => (
            <Pressable
              key={c.label}
              onPress={() => setCategory(c.label)}
              style={styles.chip}
            >
              <Text style={styles.chipText}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Rating <Text style={{ color: COLORS.muted }}>(0–5)</Text></Text>
        <TextInput
          value={rating}
          onChangeText={setRating}
          onBlur={onRatingBlur}
          placeholder="4.5"
          keyboardType="decimal-pad"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        <Text style={styles.label}>
          Description <Text style={{ color: COLORS.muted }}>({description.length}/800)</Text>
        </Text>
        <TextInput
          value={description}
          onChangeText={(t) => setDescription(t.slice(0, 800))}
          placeholder="Description"
          placeholderTextColor={COLORS.muted}
          style={[styles.input, styles.textarea]}
          multiline
        />

        {/* Нижние действия */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Pressable onPress={onReset} style={[styles.secondaryBtn]}>
            <Text style={[styles.secondaryText]}>Reset</Text>
          </Pressable>

          <Pressable
            onPress={onSave}
            disabled={!dirty || saving}
            style={[styles.saveBtn, { opacity: !dirty || saving ? 0.5 : 1 }]}
          >
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const R = 20;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.field,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  headerBtnPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  headerIcon: { width: 20, height: 20, resizeMode: 'contain' },
  headerTitle: { flex: 1, textAlign: 'center', color: COLORS.text, fontSize: 22, fontWeight: '700' },

  label: { color: COLORS.text, opacity: 0.92, marginTop: 12, marginBottom: 6, fontWeight: '600' },

  input: {
    backgroundColor: COLORS.field,
    color: COLORS.text,
    borderRadius: R,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.field,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipText: { color: COLORS.muted, fontWeight: '600' },

  secondaryBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: COLORS.muted, fontSize: 16, fontWeight: '700' },

  saveBtn: {
    flex: 2,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: COLORS.primary, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  saveText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
});
