// Components/MapScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ImageBackground, Pressable, Linking, Share, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPOTS } from '../Components/spotsData';

const COLORS = {
  bg:     '#0B0820',   // тёмный фиолетовый фон
  text:   '#EDEBFF',   // основной текст
  muted:  '#B7B5E8',   // подписи
  navy:   '#3B1573',   // основной фиолет (кнопки)
  sky:    '#C4B5FD',   // акцент/иконки
  card:   '#14112E',   // тёмная карточка поверх карты
  border: 'rgba(255,255,255,0.10)',
  white:  '#FFFFFF',
};

// Границы картинки карты
const MAP_BOUNDS = { north: 52.545, south: 52.485, west: 13.300, east: 13.470 };

// Размер маркера
const MARKER_W = 26;
const MARKER_H = 26;

export default function MapScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();

  const [username, setUsername]   = useState('User');
  const [avatar, setAvatar]       = useState(null);
  const [mapSize, setMapSize]     = useState({ w: 0, h: 0 });
  const [selected, setSelected]   = useState(null);
  const [initialSpot, setInitial] = useState(route?.params?.spot || null);

  const pointsFromParams = route?.params?.points || null;
  const previewSpot = selected || initialSpot || null;

  useEffect(() => {
    (async () => {
      const [[, name], [, photo]] = await AsyncStorage.multiGet(['profileName', 'profilePhoto']);
      if (name && name.trim()) setUsername(name.trim());
      if (photo) setAvatar(photo);
    })();
  }, []);

  const onMapLayout = e => {
    const { width, height } = e.nativeEvent.layout;
    setMapSize({ w: width, h: height });
  };

  // Проекция координат → px
  const project = (lat, lng) => {
    const { w, h } = mapSize;
    if (!w || !h) return { left: -9999, top: -9999 };

    const xNorm = (lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west);
    const yNorm = (MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south);

    const x = Math.max(0, Math.min(1, xNorm));
    const y = Math.max(0, Math.min(1, yNorm));

    let left = x * w - MARKER_W / 2;
    let top  = y * h - MARKER_H;

    left = Math.max(0, Math.min(w - MARKER_W, left));
    top  = Math.max(0, Math.min(h - MARKER_H, top));

    return { left, top };
  };

  const markers = useMemo(() => {
    const base = Array.isArray(pointsFromParams) && pointsFromParams.length
      ? pointsFromParams
      : SPOTS;
    return base.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number');
  }, [pointsFromParams]);

  // Новое #1: нативное открытие карт (Apple/geo), фоллбек — Google Maps в браузере
  const openBrowserMaps = async () => {
    try {
      // Маршрут по нескольким точкам — оставляем веб-линк
      if (Array.isArray(pointsFromParams) && pointsFromParams.length >= 2) {
        const [first, ...rest] = pointsFromParams;
        const dest = `${rest[rest.length - 1].lat},${rest[rest.length - 1].lng}`;
        const way  = rest.slice(0, -1).map(p => `${p.lat},${p.lng}`).join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${first.lat},${first.lng}&destination=${dest}${way ? `&waypoints=${encodeURIComponent(way)}` : ''}`;
        await Linking.openURL(url);
        return;
      }

      const lat = previewSpot?.lat ?? 52.52;
      const lng = previewSpot?.lng ?? 13.405;
      const label = encodeURIComponent(previewSpot?.title || 'Berlin');

      const iosUrl = `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`;
      const andUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      const nativeUrl = Platform.OS === 'ios' ? iosUrl : andUrl;
      const supported = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(supported ? nativeUrl : webUrl);
    } catch {}
  };

  const onEmptyMapPress = () => {
    if (previewSpot) {
      setSelected(null);
      setInitial(null);
    }
  };

  const openDetails = useCallback((spot) => {
    navigation.navigate('LocationDetails', { item: spot });
  }, [navigation]);

  const openSaved = () => navigation.navigate('Saved');
  const goLocations = () => navigation.navigate('Locations');
  const onSecondary = () => (previewSpot ? openDetails(previewSpot) : goLocations());

  // Новое #2: выбор случайной точки
  const randomSpot = () => {
    if (!markers.length) return;
    const rnd = markers[Math.floor(Math.random() * markers.length)];
    setInitial(null);
    setSelected(rnd);
  };

  // Новое #3: поделиться ссылкой на выбранную точку прямо из превью
  const shareSelected = async () => {
    if (!previewSpot) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${previewSpot.lat},${previewSpot.lng}`;
    try { await Share.share({ message: `${previewSpot.title}\n${url}` }); } catch {}
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userRow}>
          <Image
            source={avatar ? { uri: avatar } : require('../assets/crown.webp')}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.helloMuted}>Welcome back,</Text>
            <Text style={styles.hello}>{username || 'User'}!</Text>
          </View>
          <Text accessibilityRole="image" accessibilityLabel="waving hand" style={styles.brandEmoji}>👋</Text>
        </View>
      </View>

      {/* Тулбар (кнопки над картой, не на самой картинке) */}
      <View style={[styles.toolbarRow, { paddingHorizontal: 14 }]}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={openBrowserMaps} style={styles.toolbarBtn} hitSlop={10}>
          <Image source={require('../assets/compass.webp')} style={[styles.toolbarIcon, { tintColor: COLORS.white }]} />
        </Pressable>
        <Pressable onPress={openSaved} style={[styles.toolbarBtn, { backgroundColor: COLORS.sky }]} hitSlop={10}>
          <Image source={require('../assets/crown.webp')} style={[styles.toolbarIcon, { tintColor: COLORS.navy }]} />
        </Pressable>
        <Pressable onPress={randomSpot} style={[styles.toolbarBtn, { backgroundColor: COLORS.navy }]} hitSlop={10}>
          <Image source={require('../assets/refresh.webp')} style={[styles.toolbarIcon, { tintColor: COLORS.white }]} />
        </Pressable>
      </View>

      {/* Карта */}
      <View style={styles.mapWrap} onLayout={onMapLayout}>
        <ImageBackground
          source={require('../assets/map.webp')}
          style={styles.mapImg}
          imageStyle={styles.mapImgRadius}
        >
          {/* ловим тап по пустому месту */}
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onEmptyMapPress} />

          {/* Маркеры */}
          {markers.map((m, idx) => {
            const pos = project(m.lat, m.lng);
            return (
              <Pressable
                key={`${m.title || 'p'}-${idx}`}
                onPress={() => setSelected(m)}
                style={[styles.marker, pos]}
                hitSlop={12}
              >
                <Image source={require('../assets/point.webp')} style={styles.markerIcon} />
              </Pressable>
            );
          })}

          {/* Превью выбранной точки */}
          {previewSpot && (
            <View style={styles.preview}>
              <Image
                source={previewSpot.image}
                style={styles.previewImg}
                resizeMode="stretch"
              />
              <View style={styles.previewTextWrap}>
                <Text numberOfLines={2} style={styles.previewTitle}>{previewSpot.title}</Text>
              </View>

              {/* открыть детали */}
              <Pressable onPress={() => openDetails(previewSpot)} style={styles.previewGo} hitSlop={8}>
                <Image source={require('../assets/chevrons.webp')} style={[styles.previewGoIcon, { tintColor: COLORS.white }]} />
              </Pressable>

              {/* поделиться ссылкой */}
              <Pressable onPress={shareSelected} style={styles.previewShare} hitSlop={8}>
                <Image source={require('../assets/share.webp')} style={[styles.previewGoIcon, { tintColor: COLORS.white }]} />
              </Pressable>

              <View style={styles.previewOverlay} />
            </View>
          )}
        </ImageBackground>
      </View>

      {/* Нижние действия */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable onPress={openBrowserMaps} style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}>
          <Text style={styles.ctaText}>Open in Maps</Text>
          <Image source={require('../assets/compass.webp')} style={[styles.ctaIcon, { tintColor: COLORS.white }]} />
        </Pressable>

        <Pressable onPress={onSecondary} style={({ pressed }) => [styles.ctaSecondary, { opacity: pressed ? 0.9 : 1 }]} hitSlop={8}>
          <Text style={styles.ctaSecondaryText}>{previewSpot ? 'View Details' : 'Explore List'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const R = 22;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { paddingHorizontal: 14, marginBottom: 6 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  brandEmoji: { fontSize: 22, marginLeft: 12, includeFontPadding: false },
  helloMuted: { color: COLORS.muted, fontSize: 14 },
  hello: { color: COLORS.text, fontSize: 22, fontWeight: '700' },

  // тулбар над картой
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  toolbarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.navy,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  toolbarIcon: { width: 20, height: 20, resizeMode: 'contain' },

  mapWrap: { paddingHorizontal: 14, flex: 1 },
  mapImg: { flex: 1, borderRadius: R, overflow: 'hidden' },
  mapImgRadius: { borderRadius: R },

  marker: { position: 'absolute', zIndex: 1 },
  markerIcon: { width: MARKER_W, height: MARKER_H, resizeMode: 'contain', tintColor: COLORS.sky },

  preview: {
    position: 'absolute',
    right: 14, top: 18,
    width: 190, height: 124,
    borderRadius: 24, overflow: 'hidden',
    backgroundColor: COLORS.card,
    zIndex: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  previewImg: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  previewTextWrap: { position: 'absolute', left: 12, bottom: 12, right: 56, zIndex: 2 },
  previewTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  previewGo: {
    position: 'absolute',
    right: 8, top: 8,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.navy,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2, borderWidth: 1, borderColor: COLORS.border,
  },
  previewShare: {
    position: 'absolute',
    left: 8, top: 8,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.navy,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 2, borderWidth: 1, borderColor: COLORS.border,
  },
  previewGoIcon: { width: 18, height: 18, resizeMode: 'contain' },
  previewOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },

  bottomBar: { paddingHorizontal: 14, paddingTop: 8, flexDirection: 'row', gap: 10 },
  cta: {
    flex: 1,
    height: 62, borderRadius: 32,
    backgroundColor: COLORS.navy,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 18, borderWidth: 1, borderColor: COLORS.border,
  },
  ctaText: { color: COLORS.white, fontSize: 18, fontWeight: '800', marginRight: 8 },
  ctaIcon: { width: 20, height: 20, resizeMode: 'contain' },

  ctaSecondary: {
    width: 150, height: 62, borderRadius: 32,
    backgroundColor: COLORS.sky,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  ctaSecondaryText: { color: COLORS.navy, fontSize: 16, fontWeight: '800' },
});
