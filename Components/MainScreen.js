// Components/MainScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TextInput,
  FlatList,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { CATEGORIES, SPOTS } from '../Components/spotsData';
import { useSaved } from '../Components/SavedContext';

const COLORS = {
  bg:      '#0D0A1F', // тёмный фиолетовый фон
  primary: '#4C1D95', // фиолет-900 (активы)
  accent:  '#A78BFA', // светлая фиолетовая
  text:    '#EDEBFF', // основной текст
  surface: '#111028', // тёмная «поверхность» карточек/поиска
  chipBg:  '#1C1536', // фон неактивных чипов/поиска
  border:  '#2C2255', // бордеры
  white:   '#FFFFFF',
};

export default function MainScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const route  = useRoute();

  const [username, setUsername] = useState('User');
  const [avatar, setAvatar] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('all');

  const { isSaved, toggle } = useSaved();

  useEffect(() => {
    (async () => {
      const [[, name], [, photo]] = await AsyncStorage.multiGet([
        'profileName',
        'profilePhoto',
      ]);
      if (name && name.trim()) setUsername(name.trim());
      if (photo) setAvatar(photo);
    })();
  }, []);

  // Открытие деталей, пришедшее с карты
  useEffect(() => {
    const fromMap = route.params?.openDetailsFromMap;
    if (fromMap) {
      navigation.navigate('LocationDetails', { item: fromMap });
      navigation.setParams({ openDetailsFromMap: undefined });
    }
  }, [route.params?.openDetailsFromMap, navigation]);

  const chips = useMemo(() => [{ key: 'all', label: 'All' }, ...CATEGORIES], []);
  const data = useMemo(() => {
    let list = SPOTS;
    if (selected !== 'all') list = list.filter(i => i.categoryKey === selected);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q));
    }
    return list;
  }, [selected, search]);

  const openDetails = useCallback((item) => {
    navigation.navigate('LocationDetails', { item });
  }, [navigation]);

  const goToMapTab = useCallback(() => {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate('Map'); else navigation.navigate('Map');
  }, [navigation]);

  const goToSavedTab = useCallback(() => {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate('Saved'); else navigation.navigate('Saved');
  }, [navigation]);

  const showEmpty = search.trim().length > 0 && data.length === 0;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 0),
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right },
        ]}
      >
        <View style={styles.row}>
          <Image
            source={avatar ? { uri: avatar } : require('../assets/Logo.webp')}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.helloMuted}>Welcome back,</Text>
            <Text style={styles.hello}>{username || 'User'}!</Text>
          </View>
          <Text accessibilityRole="image" accessibilityLabel="waving hand" style={styles.brandEmoji}>👋</Text>
        </View>

        {/* Search */}
        <View style={styles.search}>
          <Image
            source={require('../assets/search.webp')}
            style={[styles.searchIcon, { tintColor: COLORS.accent }]}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search for a place..."
            placeholderTextColor="#B7B5E8"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={10}>
              <Image
                source={require('../assets/close.webp')}
                style={[styles.clearIcon, { tintColor: COLORS.accent }]}
              />
            </Pressable>
          )}
        </View>

        {/* Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={chips}
          keyExtractor={(i) => i.key}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          style={{ marginTop: 12 }}
          contentContainerStyle={{ paddingRight: insets.right }}
          renderItem={({ item }) => {
            const active = selected === item.key;
            return (
              <Pressable
                onPress={() => setSelected(item.key)}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: COLORS.primary }
                    : { backgroundColor: COLORS.chipBg, borderWidth: 1, borderColor: COLORS.border },
                ]}
              >
                {!!item.emoji && (
                  <Text
                    style={[
                      styles.chipEmoji,
                      { color: active ? COLORS.white : COLORS.accent },
                    ]}
                  >
                    {item.emoji}{' '}
                  </Text>
                )}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.chipText,
                    { color: active ? COLORS.white : COLORS.accent },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Section header */}
      {!showEmpty && (
        <View
          style={[
            styles.sectionHeader,
            { paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right },
          ]}
        >
          <Text style={styles.sectionTitle}>Popular Spots in Berlin</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* новая основная: корона → Saved */}
            <Pressable onPress={goToSavedTab} hitSlop={8}>
              <View style={[styles.fab, { backgroundColor: COLORS.primary }]}>
                <Image
                  source={require('../assets/crown.webp')}
                  style={[styles.fabIcon, { tintColor: COLORS.white }]}
                />
              </View>
            </Pressable>
            {/* дополнительная маленькая: пин → Map */}
            <Pressable onPress={goToMapTab} hitSlop={8}>
              <View style={[styles.fabSmall, { backgroundColor: COLORS.accent }]}>
                <Image
                  source={require('../assets/point.webp')}
                  style={[styles.fabSmallIcon, { tintColor: COLORS.bg }]}
                />
              </View>
            </Pressable>
          </View>
        </View>
      )}

      {/* Empty state OR Cards */}
      {showEmpty ? (
        <View
          style={[
            styles.emptyWrap,
            { paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right },
          ]}
        >
          <Image source={require('../assets/Logo.webp')} style={styles.emptyLogo} />
          <Text style={styles.emptyText}>
            Looks like we haven’t added that spot yet —{'\n'}
            but Berlin’s full of surprises, and we’re working on it!
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => String(i.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 28 + insets.bottom,
            paddingLeft: 16 + insets.left,
            paddingRight: 16 + insets.right,
          }}
          renderItem={({ item }) => {
            const savedNow = isSaved(item.id);
            return (
              <View style={styles.cardWrap}>
                <ImageBackground
                  source={item.image}
                  style={styles.cardImage}
                  imageStyle={styles.cardImageRadius}
                >
                  {/* top row */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingStar}>⭐</Text>
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>

                    <Pressable onPress={() => toggle(item.id)} style={styles.bookmarkBtn}>
                      <Image
                        source={require('../assets/crown.webp')}
                        style={[
                          styles.bookmarkIcon,
                          { tintColor: savedNow ? COLORS.accent : COLORS.white, opacity: savedNow ? 1 : 0.9 },
                        ]}
                      />
                    </Pressable>
                  </View>

                  {/* bottom info */}
                  <View style={styles.cardBottom}>
                    <Text style={styles.cardCategory}>{item.categoryLabel}</Text>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>

                  {/* go button — шевроны */}
                  <Pressable onPress={() => openDetails(item)} style={styles.goBtn}>
                    <Image
                      source={require('../assets/chevrons.webp')}
                      style={[styles.goIcon, { tintColor: COLORS.white }]}
                    />
                  </Pressable>

                  {/* overlay */}
                  <View style={styles.cardOverlay} />
                </ImageBackground>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  brandEmoji: { fontSize: 22, marginLeft: 12, includeFontPadding: false },

  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { paddingTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.chipBg },

  helloMuted: { color: '#B7B5E8', fontSize: 14 },
  hello: { color: COLORS.text, fontSize: 24, fontWeight: '700' },

  search: {
    marginTop: 14,
    backgroundColor: COLORS.chipBg,
    borderRadius: 28,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { width: 18, height: 18, marginRight: 8, resizeMode: 'contain' },
  clearIcon: { width: 16, height: 16, marginLeft: 8, resizeMode: 'contain' },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 16 },

  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    flexDirection: 'row',
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 14, fontWeight: '600', maxWidth: 220 },

  sectionHeader: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: COLORS.text, fontSize: 24, fontWeight: '700' },

  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  fabIcon: { width: 22, height: 22, resizeMode: 'contain' },

  fabSmall: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  fabSmallIcon: { width: 18, height: 18, resizeMode: 'contain' },

  // Cards
  cardWrap: { marginTop: 14 },
  cardImage: { height: 240, borderRadius: 20, overflow: 'hidden' },
  cardImageRadius: { borderRadius: 20 },

  cardTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(12,10,28,0.55)',
    borderColor: COLORS.white,
    borderWidth: 1,
  },
  ratingStar: { fontSize: 14, marginRight: 6, color: COLORS.white },
  ratingText: { color: COLORS.white, fontWeight: '700' },

  bookmarkBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(12,10,28,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  bookmarkIcon: { width: 40, height: 40, resizeMode: 'contain' },

  cardBottom: {
    position: 'absolute',
    left: 16,
    right: 90,
    bottom: 20,
    zIndex: 2,
  },
  cardCategory: { color: COLORS.white, opacity: 0.92, marginBottom: 6, fontSize: 13, fontWeight: '600' },
  cardTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800' },

  goBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  goIcon: { width: 22, height: 22, resizeMode: 'contain' },

  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyLogo: { width: 80, height: 80, resizeMode: 'contain', tintColor: COLORS.accent, marginBottom: 16 },
  emptyText: { color: COLORS.text, textAlign: 'center', fontSize: 16, lineHeight: 22 },
});
