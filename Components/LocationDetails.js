// Components/LocationDetails.js
import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ImageBackground, ScrollView,
  Pressable, Linking, Platform, Share, Alert, useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSaved } from '../Components/SavedContext';
import { withOverrides } from '../Components/spotsOverrides';

const COLORS = {
  bg:      '#0D0A1F',
  primary: '#4C1D95',
  accent:  '#A78BFA',
  text:    '#EDEBFF',
  surface: '#111028',
  chipBg:  '#1C1536',
  border:  '#2C2255',
  white:   '#FFFFFF',
};

export default function LocationDetails({ route, navigation }) {
  const { item: rawItem } = route.params || {};
  const insets = useSafeAreaInsets();
  const { isSaved, toggle } = useSaved();
  const { width } = useWindowDimensions();
  const stacked = width < 420; // 👉 две строки на телефонах/узких экранах

  const [item, setItem] = useState(rawItem || {});

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const merged = await withOverrides(rawItem);
        if (alive) setItem(merged || rawItem);
      })();
      return () => { alive = false; };
    }, [rawItem?.id])
  );

  const hasCoords = useMemo(
    () => typeof item?.lat === 'number' && typeof item?.lng === 'number',
    [item]
  );

  const openMap = async () => {
    if (!hasCoords) return;
    const label = encodeURIComponent(item.title || 'Location');
    const { lat, lng } = item;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`
        : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    const supported = await Linking.canOpenURL(url);
    if (supported) Linking.openURL(url);
    else Alert.alert('Oops', 'Cannot open maps on this device');
  };

  const onShare = async () => {
    try { await Share.share({ message: `${item.title}\n${item.description}\n\n(${item.lat}, ${item.lng})` }); } catch {}
  };

  const onEdit = () => {
    if (!item?.id) return Alert.alert('Edit', 'Cannot edit this item (no id).');
    navigation.navigate('EditLocation', { spot: item });
  };

  const onStartStory = () => navigation.navigate('AddStory', { spot: item });

  const onMore = () => {
    const opts = [];
    if (hasCoords) {
      const { lat, lng } = item;
      opts.push({ text: 'Open Street View', onPress: () => Linking.openURL(`https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}`) });
    }
    const q = encodeURIComponent(`${item?.title || 'Berlin place'} Berlin`);
    opts.push({ text: 'Search on Web', onPress: () => Linking.openURL(`https://www.google.com/search?q=${q}`) });
    opts.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(item?.title || 'Location', 'Quick actions', opts);
  };

  const saved = item?.id ? isSaved(item.id) : false;
  const mapsLabel  = stacked ? 'Maps'  : 'Open in Maps';
  const storyLabel = stacked ? 'Story' : 'Start Story';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.headerRow, { paddingHorizontal: 14 + insets.left }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={10}>
          <Image source={require('../assets/back.webp')} style={[styles.headerIcon, { tintColor: COLORS.text }]} />
        </Pressable>

        <Text style={styles.headerTitle}>Details</Text>

        <View style={styles.headerRight}>
          {item?.id && (
            <Pressable onPress={() => toggle(item.id)} style={styles.headerBtn} hitSlop={10}>
              <Image
                source={require('../assets/crown.webp')}
                style={[styles.headerIcon, { tintColor: saved ? COLORS.accent : COLORS.text, opacity: saved ? 1 : 0.9 }]}
              />
            </Pressable>
          )}
          <Pressable onPress={onMore} style={[styles.headerBtn, { marginLeft: 8 }]} hitSlop={10}>
            <Image source={require('../assets/more.webp')} style={[styles.headerIcon, { tintColor: COLORS.text }]} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 200 + insets.bottom }}>
        {/* Hero image */}
        <View style={[styles.heroWrap, { paddingHorizontal: 14 + insets.left }]}>
          <ImageBackground
            source={item.image}
            style={styles.hero}
            imageStyle={styles.heroImg}
            resizeMode="cover"
            resizeMethod="resize"
          >
            <View style={styles.heroBottom}>
              <Text style={styles.heroCategory}>{item.categoryLabel}</Text>
              <Text style={styles.heroTitle}>{item.title}</Text>
            </View>
            <View style={styles.heroOverlay} />
          </ImageBackground>
        </View>

        {/* Description card */}
        <View style={[styles.card, { marginHorizontal: 14 + insets.left }]}>
          <View style={styles.cardTopRow}>
            <View style={styles.ratingBadge}>
              <Text style={{ fontSize: 14, marginRight: 6, color: COLORS.accent }}>⭐</Text>
              <Text style={[styles.ratingText, { color: COLORS.accent }]}>{item.rating}</Text>
            </View>

            {item?.id && (
              <Pressable onPress={() => toggle(item.id)} style={styles.bookmarkBtn} hitSlop={10}>
                <Image
                  source={require('../assets/crown.webp')}
                  style={[styles.bookmarkIcon, { tintColor: saved ? COLORS.accent : COLORS.white, opacity: saved ? 1 : 0.9 }]}
                />
              </Pressable>
            )}
          </View>

          <Text style={styles.desc}>{item.description}</Text>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { paddingLeft: 14 + insets.left, paddingRight: 14 + insets.right, paddingBottom: insets.bottom + 8 }]}>
        {stacked ? (
          // ДВЕ СТРОКИ
          <View style={styles.bottomStack}>
            {/* Row 1: Maps + Share */}
            <View style={styles.rowBar}>
              <Pressable
                onPress={openMap}
                disabled={!hasCoords}
                style={({ pressed }) => [styles.ctaGrow, { opacity: hasCoords ? (pressed ? 0.9 : 1) : 0.5 }]}
              >
                <Image source={require('../assets/point.webp')} style={[styles.ctaIcon, { tintColor: COLORS.white }]} />
                <Text style={styles.ctaText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {mapsLabel}
                </Text>
              </Pressable>

              <Pressable onPress={onShare} style={styles.fab} hitSlop={10}>
                <Image source={require('../assets/share.webp')} style={[styles.fabIcon, { tintColor: COLORS.white }]} />
              </Pressable>
            </View>

            {/* Row 2: Story + Edit */}
            <View style={styles.rowBar}>
              <Pressable
                onPress={onStartStory}
                style={({ pressed }) => [styles.ctaGrow, { backgroundColor: COLORS.accent, borderColor: COLORS.border, opacity: pressed ? 0.9 : 1 }]}
              >
                <Image source={require('../assets/pencil.webp')} style={[styles.ctaIcon, { tintColor: COLORS.bg }]} />
                <Text style={[styles.ctaText, { color: COLORS.bg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {storyLabel}
                </Text>
              </Pressable>

              <Pressable onPress={onEdit} style={[styles.fab, { backgroundColor: COLORS.accent }]} hitSlop={10}>
                <Image source={require('../assets/pencil.webp')} style={[styles.fabIcon, { tintColor: COLORS.bg }]} />
              </Pressable>
            </View>
          </View>
        ) : (
          // ОДНА СТРОКА (как раньше)
          <>
            <Pressable
              onPress={openMap}
              disabled={!hasCoords}
              style={({ pressed }) => [styles.cta, { opacity: hasCoords ? (pressed ? 0.9 : 1) : 0.5 }]}
            >
              <Image source={require('../assets/point.webp')} style={[styles.ctaIcon, { tintColor: COLORS.white }]} />
              <Text style={styles.ctaText} numberOfLines={1}>{mapsLabel}</Text>
            </Pressable>

            <Pressable
              onPress={onStartStory}
              style={({ pressed }) => [styles.cta, { backgroundColor: COLORS.accent, opacity: pressed ? 0.9 : 1 }]}
            >
              <Image source={require('../assets/pencil.webp')} style={[styles.ctaIcon, { tintColor: COLORS.bg }]} />
              <Text style={[styles.ctaText, { color: COLORS.bg }]} numberOfLines={1}>{storyLabel}</Text>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={onShare} style={styles.fab} hitSlop={10}>
                <Image source={require('../assets/share.webp')} style={[styles.fabIcon, { tintColor: COLORS.white }]} />
              </Pressable>
              <Pressable onPress={onEdit} style={[styles.fab, { backgroundColor: COLORS.accent }]} hitSlop={10}>
                <Image source={require('../assets/pencil.webp')} style={[styles.fabIcon, { tintColor: COLORS.bg }]} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const RADIUS = 20;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.chipBg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerRight: { flexDirection: 'row' },
  headerIcon: { width: 20, height: 20, resizeMode: 'contain' },
  headerTitle: { flex: 1, textAlign: 'center', color: COLORS.text, fontSize: 22, fontWeight: '700' },

  // Hero
  heroWrap: { marginTop: 4 },
  hero: { height: 220, borderRadius: RADIUS, overflow: 'hidden', justifyContent: 'flex-end' },
  heroImg: { borderRadius: RADIUS },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  heroBottom: { position: 'absolute', left: 14, right: 14, bottom: 12, zIndex: 2 },
  heroCategory: { color: COLORS.white, opacity: 0.95, marginBottom: 6, fontSize: 13, fontWeight: '600' },
  heroTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800' },

  // Card
  card: {
    marginTop: 14,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.chipBg,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  ratingText: { fontWeight: '700' },

  bookmarkBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.chipBg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  bookmarkIcon: { width: 40, height: 40, resizeMode: 'contain' },

  desc: { color: COLORS.text, fontSize: 15, lineHeight: 22, marginTop: 4 },

  // Bottom bar (общий контейнер)
  bottomBar: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    alignItems: 'stretch',
    gap: 10,
  },

  // ОДНА строка
  cta: {
    flex: 1,
    height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  ctaText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  ctaIcon: { width: 20, height: 20, resizeMode: 'contain', marginRight: 6 },

  // ДВЕ строки
  bottomStack: { width: '100%', gap: 10 },
  rowBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctaGrow: {
    flex: 1,
    height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },

  // FAB
  fab: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 1, borderColor: COLORS.border,
  },
  fabIcon: { width: 22, height: 22, resizeMode: 'contain' },
});
