// Components/AddStory.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Image, Pressable, TextInput, ScrollView, Alert,
  Platform, KeyboardAvoidingView, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDiary } from '../Components/DiaryContext';

const COLORS = {
  bg:      '#0D0A1F',  // общий тёмно-фиолетовый
  text:    '#EDEBFF',  // основной текст
  muted:   '#B7B5E8',  // вторичный
  card:    '#111028',  // карточки/поля
  border:  '#2C2255',  // бордеры
  primary: '#4C1D95',  // фиолет-900 (кнопки)
  accent:  '#A78BFA',  // светлая фиолетовая (акцент)
  danger:  '#EF4444',
  white:   '#FFFFFF',
  black:   '#000000',
};

const CATEGORIES = [
  { key: 'landmarks', label: 'Historical Landmarks', emoji: '🏛️' },
  { key: 'art',       label: 'Art & Design Spots',   emoji: '🎨'  },
  { key: 'ent',       label: 'Entertainment',        emoji: '🎉'  },
  { key: 'people',    label: 'Moments & People',     emoji: '🎭'  },
  { key: 'night',     label: 'Night & City Vibes',   emoji: '🌃'  },
  { key: 'other',     label: 'Other',                emoji: '📎'  },
];

const DRAFT_KEY = 'story_draft_v1';

export default function AddStory({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const spot   = route?.params?.spot || null;
  const editingStory = route?.params?.story || null;

  const { addStory, updateStory } = useDiary();

  const [title, setTitle]            = useState(editingStory?.title || '');
  const [category, setCategory]      = useState(editingStory?.categoryKey || 'landmarks');
  const [locationTitle, setLocation] = useState(editingStory?.locationTitle ?? spot?.title ?? '');
  const [desc, setDesc]              = useState(editingStory?.description || '');
  const [photos, setPhotos]          = useState(() =>
    editingStory?.photos?.length ? editingStory.photos : []
  );
  const [coverIndex, setCoverIndex]  = useState(0);
  const [isPrivate, setPrivate]      = useState(!!editingStory?.private);

  const [dirty, setDirty]            = useState(false);
  const [saving, setSaving]          = useState(false);

  // Восстановление черновика (если не режим редактирования)
  useEffect(() => {
    (async () => {
      if (editingStory) return;
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        if (!draft) return;
        Alert.alert(
          'Restore draft?',
          'We found an unsaved story. Do you want to restore it?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Restore', onPress: () => {
              setTitle(draft.title || '');
              setCategory(draft.category || 'landmarks');
              setLocation(draft.locationTitle || '');
              setDesc(draft.desc || '');
              setPhotos(Array.isArray(draft.photos) ? draft.photos : []);
              setCoverIndex(draft.coverIndex ?? 0);
              setPrivate(!!draft.isPrivate);
            }}
          ]
        );
      } catch {}
    })();
  }, [editingStory]);

  // Автосохранение черновика
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(async () => {
      try {
        const payload = { title, category, locationTitle, desc, photos, coverIndex, isPrivate };
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [title, category, locationTitle, desc, photos, coverIndex, isPrivate, dirty]);

  const selectedCat = useMemo(
    () => CATEGORIES.find(c => c.key === category) || CATEGORIES[0],
    [category]
  );

  // Генератор идей заголовка
  const suggestTitle = () => {
    const place = (locationTitle || 'Berlin').trim();
    const base  = selectedCat.label.split(' ')[0];
    const ideas = [
      `${base} at ${place}`,
      `${place} — a moment to remember`,
      `Tracing stories in ${place}`,
    ];
    Alert.alert('Title ideas', ideas.join('\n'), [
      { text: ideas[0], onPress: () => { setTitle(ideas[0]); setDirty(true); } },
      { text: ideas[1], onPress: () => { setTitle(ideas[1]); setDirty(true); } },
      { text: ideas[2], onPress: () => { setTitle(ideas[2]); setDirty(true); } },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  // Выбор фото
  const pickImages = () => {
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 0, quality: 1, includeBase64: false },
      (res) => {
        if (res?.didCancel || res?.errorCode) return;
        const assets = res.assets || [];
        if (!assets.length) return;
        const newSources = assets.filter(a => a?.uri).map(a => ({ uri: a.uri }));
        setPhotos(prev => [...prev, ...newSources]);
        setDirty(true);
      }
    );
  };

  const clearPhotos = () => {
    if (!photos.length) return;
    Alert.alert('Remove all photos?', 'This will clear the photo grid.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { setPhotos([]); setCoverIndex(0); setDirty(true); } },
    ]);
  };

  const clearDraft = async () => {
    try { await AsyncStorage.removeItem(DRAFT_KEY); } catch {}
  };

  // Новое: сохранить черновик принудительно
  const saveDraftNow = async () => {
    try {
      const payload = { title, category, locationTitle, desc, photos, coverIndex, isPrivate };
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      setDirty(false);
      Alert.alert('Draft saved', 'You can restore it next time you open Add Story.');
    } catch {
      Alert.alert('Error', 'Failed to save draft.');
    }
  };

  // Новое: очистить форму
  const clearForm = () => {
    Alert.alert('Clear form?', 'This will reset all fields (keeps your draft unless you discard it).', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => {
        setTitle(''); setCategory('landmarks');
        setLocation(spot?.title ?? '');
        setDesc(''); setPhotos([]); setCoverIndex(0); setPrivate(false);
        setDirty(true);
      }},
    ]);
  };

  // Новое: вставить отметку времени в описание
  const insertTimestamp = () => {
    const stamp = new Date().toLocaleString();
    setDesc(d => (d ? `${d}\n— ${stamp}` : `— ${stamp}`));
    setDirty(true);
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true);

    const coverFromIndex = photos[coverIndex] || photos[0];
    const computedCover =
      (coverFromIndex && (coverFromIndex.uri ? coverFromIndex.uri : coverFromIndex)) ||
      editingStory?.cover ||
      require('../assets/Logo.webp');

    const base = {
      title: (title || '').trim() || 'Some Title',
      categoryKey: category,
      categoryLabel: `${selectedCat.emoji} ${selectedCat.label}`,
      locationTitle: (locationTitle || '').trim(),
      description: (desc || '').trim(),
      lat: spot?.lat ?? editingStory?.lat ?? null,
      lng: spot?.lng ?? editingStory?.lng ?? null,
      cover: computedCover,
      photos: photos,
      private: isPrivate,
    };

    try {
      if (editingStory?.id) {
        const payload = { ...editingStory, ...base };
        await updateStory(payload);
        setDirty(false);
        await clearDraft();
        navigation.replace('StoryDetails', { story: payload });
      } else {
        const payload = { ...base, createdAt: Date.now() };
        const saved = await addStory(payload);
        setDirty(false);
        await clearDraft();
        navigation.replace('StoryDetails', { story: saved });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save the story.');
    } finally {
      setSaving(false);
    }
  };

  const titleCount = title.trim().length;
  const descCount  = desc.trim().length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Image source={require('../assets/back.webp')} style={[styles.headerIcon, { tintColor: COLORS.text }]} />
        </Pressable>
        <Text style={styles.headerTitle}>{editingStory ? 'Edit Story' : 'Add Story'}</Text>
        <Pressable onPress={onSave} style={[styles.headerBtn, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
          <Text style={{ color: COLORS.white, fontWeight: '700', opacity: saving ? 0.6 : 1 }}>
            Save
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.h1}>Leave Your Mark on Berlin</Text>

          {/* Title + suggest */}
          <View style={{ marginHorizontal: 14 }}>
            <View style={styles.inputRow}>
              <TextInput
                value={title}
                onChangeText={(t) => { setTitle(t); setDirty(true); }}
                placeholder="Story Title"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />
              <Pressable onPress={suggestTitle} style={styles.suggestBtn}>
                <Text style={{ color: COLORS.bg, fontWeight: '700' }}>Suggest</Text>
              </Pressable>
            </View>
            <Text style={styles.counter}>{titleCount} chars</Text>
          </View>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <Pressable onPress={saveDraftNow} style={[styles.quickBtn, { backgroundColor: COLORS.card }]}>
              <Image source={require('../assets/refresh.webp')} style={[styles.quickIcon, { tintColor: COLORS.accent }]} />
              <Text style={styles.quickText}>Save draft now</Text>
            </Pressable>
            <Pressable onPress={insertTimestamp} style={[styles.quickBtn, { backgroundColor: COLORS.card }]}>
              <Image source={require('../assets/clock.webp')} style={[styles.quickIcon, { tintColor: COLORS.accent }]} />
              <Text style={styles.quickText}>Insert timestamp</Text>
            </Pressable>
            <Pressable onPress={clearForm} style={[styles.quickBtn, { backgroundColor: COLORS.card }]}>
              <Image source={require('../assets/trash.webp')} style={[styles.quickIcon, { tintColor: COLORS.accent }]} />
              <Text style={styles.quickText}>Clear form</Text>
            </Pressable>
          </View>

          {/* Category chips */}
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((c) => {
              const active = c.key === category;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => { setCategory(c.key); setDirty(true); }}
                  style={[
                    styles.chip,
                    { backgroundColor: active ? COLORS.primary : COLORS.card, borderColor: active ? COLORS.primary : COLORS.border }
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? COLORS.white : COLORS.text }]}>{c.emoji} {c.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Location */}
          <View style={[styles.input, styles.inputOutlined, { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14 }]}>
            <TextInput
              value={locationTitle}
              onChangeText={(t) => { setLocation(t); setDirty(true); }}
              placeholder="Location"
              placeholderTextColor={COLORS.muted}
              style={{ flex: 1, color: COLORS.text, fontSize: 16 }}
            />
            <Image source={require('../assets/point.webp')} style={{ width: 18, height: 18, tintColor: COLORS.accent, marginLeft: 8 }} />
          </View>

          {/* Mini map (статичное превью) */}
          <View style={styles.mapBox}>
            <Image source={require('../assets/map.webp')} style={styles.mapImg} />
          </View>

          {/* Description */}
          <View style={{ marginHorizontal: 14 }}>
            <TextInput
              value={desc}
              onChangeText={(t) => { setDesc(t); setDirty(true); }}
              placeholder="Describe the moment — how it felt, what you saw, what it meant"
              placeholderTextColor={COLORS.muted}
              style={styles.textarea}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.counter}>{descCount} chars</Text>
          </View>

          {/* Privacy */}
          <View style={styles.privacyRow}>
            <View>
              <Text style={{ color: COLORS.text, fontWeight: '700' }}>Private story</Text>
              <Text style={{ color: COLORS.muted, fontSize: 12 }}>Only you will see it in Journal</Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={(v) => { setPrivate(v); setDirty(true); }}
              trackColor={{ true: COLORS.accent, false: COLORS.border }}
              thumbColor={COLORS.white}
              ios_backgroundColor={COLORS.border}
            />
          </View>

          {/* Photos */}
          <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 14, marginTop: 14 }}>
            <Pressable onPress={pickImages} style={[styles.addPhotos, { flex: 1 }]}>
              <Text style={{ color: COLORS.bg, fontSize: 16, fontWeight: '700' }}>Add Photos</Text>
              <Image source={require('../assets/image.webp')} style={{ width: 20, height: 20, marginLeft: 8, tintColor: COLORS.bg }} />
            </Pressable>
            <Pressable onPress={clearPhotos} style={[styles.addPhotos, { flex: 0.9, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }]}>
              <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}>Clear photos</Text>
            </Pressable>
          </View>

          <View style={styles.photosGrid}>
            {photos.map((ph, idx) => {
              const src = typeof ph === 'string' ? { uri: ph } : ph;
              const isCover = idx === coverIndex;
              return (
                <View key={idx} style={styles.photoWrap}>
                  <Image source={src} style={styles.photoImg} />
                  {/* make cover */}
                  <Pressable
                    onPress={() => { setCoverIndex(idx); setDirty(true); }}
                    style={[
                      styles.coverBadge,
                      { backgroundColor: isCover ? COLORS.primary : 'rgba(0,0,0,0.45)', borderColor: isCover ? COLORS.primary : 'transparent' }
                    ]}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: 12 }}>
                      {isCover ? 'COVER' : 'SET COVER'}
                    </Text>
                  </Pressable>
                  {/* remove */}
                  <Pressable
                    onPress={() => {
                      setPhotos(p => p.filter((_, i) => i !== idx));
                      if (coverIndex === idx) setCoverIndex(0);
                      setDirty(true);
                    }}
                    style={styles.photoX}
                    hitSlop={8}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: '800' }}>×</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Черновик: сброс */}
          <Pressable
            onPress={() => {
              Alert.alert('Discard draft?', 'This will remove the autosaved draft for this screen.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: clearDraft },
              ]);
            }}
            style={styles.discardBtn}
          >
            <Text style={{ color: COLORS.danger, fontWeight: '700' }}>Discard Draft</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const R = 22;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, marginBottom: 8,
  },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerIcon: { width: 20, height: 20, resizeMode: 'contain' },
  headerTitle: { flex: 1, textAlign: 'center', color: COLORS.text, fontSize: 22, fontWeight: '700' },

  h1: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginHorizontal: 14, marginTop: 6, marginBottom: 12 },

  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 28,
    paddingHorizontal: 18,
    height: 54,
    fontSize: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputOutlined: { borderWidth: 1, borderColor: COLORS.border },

  suggestBtn: {
    height: 54, paddingHorizontal: 16, borderRadius: 28,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  counter: { color: COLORS.muted, fontSize: 12, marginTop: 6 },

  quickRow: {
    marginTop: 8, marginHorizontal: 14,
    flexDirection: 'row', gap: 8,
  },
  quickBtn: {
    flex: 1,
    height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1, borderColor: COLORS.border,
  },
  quickIcon: { width: 16, height: 16, marginRight: 8, resizeMode: 'contain' },
  quickText: { color: COLORS.text, fontWeight: '700', fontSize: 13 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 14, gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 22,
    borderWidth: 1,
  },
  chipText: { fontWeight: '600', color: COLORS.text },

  mapBox: {
    marginHorizontal: 14, backgroundColor: COLORS.card, borderRadius: R,
    overflow: 'hidden', height: 210, marginTop: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  mapImg: { width: '100%', height: '100%', resizeMode: 'cover' },

  textarea: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: 140,
    fontSize: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },

  addPhotos: {
    height: 54, borderRadius: 28,
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 18,
    borderWidth: 1, borderColor: COLORS.border,
  },

  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 14, marginTop: 12, paddingBottom: 16 },
  photoWrap: { width: '48%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', position: 'relative', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  photoImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoX: {
    position: 'absolute', right: 8, top: 8, width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute', left: 8, bottom: 8,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    borderWidth: 1,
  },

  privacyRow: {
    marginHorizontal: 14, marginTop: 8, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },

  discardBtn: {
    alignSelf: 'center',
    marginTop: 6, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.danger + '22',
    backgroundColor: COLORS.danger + '0D',
  },
});
