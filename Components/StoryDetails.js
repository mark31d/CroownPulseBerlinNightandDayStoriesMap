// Components/StoryDetails.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Image, ImageBackground, ScrollView,
  Pressable, Share, Alert, Linking, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '../Components/DiaryContext';

const { width: SCREEN_W } = Dimensions.get('window');

const COLORS = {
  bg:      '#FFFFFF',
  text:    '#0B1220',
  muted:   '#64748B',
  card:    '#F1F5F9',
  border:  '#E5E7EB',
  primary: '#1E3A8A',
  accent:  '#60A5FA',
  danger:  '#EF4444',
  white:   '#FFFFFF',
};

export default function StoryDetails({ route, navigation }) {
  const insets = useSafeAreaInsets();

  // локальная копия, чтобы мгновенно отражать изменения (privacy и т.п.)
  const [story, setStory] = useState(route?.params?.story || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const { deleteStory, updateStory } = useDiary();

  // галерея: cover + photos (без дублей)
  const photos = useMemo(() => {
    const list = [];
    const push = (src) => {
      const obj = typeof src === 'string' ? { uri: src } : src;
      if (!list.find(x => JSON.stringify(x) === JSON.stringify(obj))) list.push(obj);
    };
    if (story?.cover) push(story.cover);
    if (Array.isArray(story?.photos)) story.photos.forEach(push);
    return list.length ? list : [require('../assets/image.webp')];
  }, [story]);

  if (!story) {
    return (
      <SafeAreaView style={styles.container} edges={['top','left','right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.text }}>Story not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onShare = async () => {
    if (story.private) {
      Alert.alert('Private story', 'This story is private. Make it public to share.');
      return;
    }
    try {
      await Share.share({ message: `${story.title}\n\n${story.description || ''}` });
    } catch {}
  };

  const togglePrivacy = async () => {
    try {
      const next = { ...story, private: !story.private };
      await updateStory(next); // в AddStory мы сохраняем поле private
      setStory(next);
      setMenuOpen(false);
    } catch {
      Alert.alert('Error', 'Failed to change visibility.');
    }
  };

  const onEdit = () => {
    setMenuOpen(false);
    navigation.replace('AddStory', {
      spot: { lat: story.lat, lng: story.lng, title: story.locationTitle },
      story,
    });
  };

  const onDelete = async () => {
    setMenuOpen(false);
    Alert.alert(
      'Delete this story?',
      'This story will be permanently removed from the map.\nAre you sure you want to delete it?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStory(story.id);
              navigation.goBack();
            } catch {}
          },
        },
      ]
    );
  };

  const openBrowserMaps = async () => {
    const { lat, lng, locationTitle } = story || {};
    let url = '';
    if (typeof lat === 'number' && typeof lng === 'number') {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else if (locationTitle) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationTitle)}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=Berlin`;
    }
    try { await Linking.openURL(url); } catch {}
  };

  const hasCoords = typeof story?.lat === 'number' && typeof story?.lng === 'number';
  const dateLabel = story?.createdAt ? new Date(story.createdAt).toLocaleDateString() : null;

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      {/* Header */}
      <View
        style={[
          styles.headerRow,
          { paddingLeft: 14 + insets.left, paddingRight: 14 + insets.right }
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={10}>
          <Image source={require('../assets/back.webp')} style={[styles.headerIcon, { tintColor: COLORS.text }]} />
        </Pressable>
        <Text style={styles.headerTitle}>Story</Text>
        <Pressable onPress={() => setMenuOpen(v => !v)} style={styles.headerBtn} hitSlop={10}>
          <Image source={require('../assets/more.webp')} style={[styles.headerIcon, { tintColor: COLORS.text }]} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Cover gallery */}
        <View style={styles.galleryWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 28));
              setPhotoIndex(i);
            }}
          >
            {photos.map((src, i) => (
              <Image key={i} source={src} style={styles.galleryImage} />
            ))}
          </ScrollView>

          {/* индикатор / приватность */}
          <View style={styles.galleryTopRow}>
            {story.private && (
              <View style={styles.privateBadge}>
                <Text style={styles.privateText}>PRIVATE</Text>
              </View>
            )}
            <View style={styles.galleryCounterBox}>
              <Text style={styles.galleryCounter}>{photoIndex + 1} / {photos.length}</Text>
            </View>
          </View>
        </View>

        {/* Meta */}
        <View style={{ paddingHorizontal: 14, paddingTop: 16 }}>
          {!!story.categoryLabel && (
            <Text style={{ color: COLORS.muted, marginBottom: 4 }}>
              {story.categoryLabel}{dateLabel ? `  ·  ${dateLabel}` : ''}
            </Text>
          )}
          <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800' }}>
            {story.title || 'Some Title'}
          </Text>
        </View>

        {/* Location card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../assets/point.webp')} style={{ width: 18, height: 18, tintColor: COLORS.accent, marginRight: 8 }} />
              <Text style={styles.cardTitle}>{story.locationTitle || 'Location title'}</Text>
            </View>

            <Pressable
              onPress={openBrowserMaps}
              style={[styles.smallFab, { opacity: hasCoords || story.locationTitle ? 1 : 0.5 }]}
              disabled={!hasCoords && !story.locationTitle}
              accessibilityRole="button"
              accessibilityLabel="Open in Google Maps"
            >
              <Image source={require('../assets/compass.webp')} style={{ width: 18, height: 18, tintColor: COLORS.white }} />
            </Pressable>
          </View>

          <ImageBackground source={require('../assets/map.webp')} style={styles.map} imageStyle={{ borderRadius: 18 }}>
            <View style={styles.mapPinWrap}>
              <Image source={require('../assets/point.webp')} style={styles.mapPin} />
            </View>
          </ImageBackground>

          {!!story.description && <Text style={styles.desc}>{story.description}</Text>}
        </View>
      </ScrollView>

      {/* Floating share */}
      <Pressable
        onPress={onShare}
        style={[
          styles.floatingShare,
          { right: 18 + insets.right, bottom: 26 + insets.bottom, opacity: story.private ? 0.4 : 1 }
        ]}
      >
        <Image source={require('../assets/share.webp')} style={{ width: 20, height: 20, tintColor: COLORS.white }} />
      </Pressable>

      {/* Overlay & Menu */}
      {menuOpen && (
        <>
          <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)} />
          <View style={[styles.menu, { top: 58 + insets.top, right: 14 + insets.right }]}>
            <Pressable style={styles.menuItem} onPress={onEdit}>
              <Image source={require('../assets/edit.webp')} style={[styles.menuIcon, { tintColor: COLORS.text }]} />
              <Text style={[styles.menuText, { color: COLORS.text }]}>Edit</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={togglePrivacy}>
              <Image source={require('../assets/lock.webp')} style={[styles.menuIcon, { tintColor: COLORS.primary }]} />
              <Text style={[styles.menuText, { color: COLORS.primary }]}>
                {story.private ? 'Make Public' : 'Make Private'}
              </Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={onDelete}>
              <Image source={require('../assets/trash.webp')} style={[styles.menuIcon, { tintColor: COLORS.danger }]} />
              <Text style={[styles.menuText, { color: COLORS.danger }]}>Delete</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const R = 22;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, marginBottom: 6,
  },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerIcon: { width: 20, height: 20, resizeMode: 'contain' },
  headerTitle: { flex: 1, textAlign: 'center', color: COLORS.text, fontSize: 22, fontWeight: '700' },

  // gallery
  galleryWrap: { backgroundColor: COLORS.card, borderRadius: R, overflow: 'hidden', marginHorizontal: 14 },
  galleryImage: { width: SCREEN_W - 28, height: 320, resizeMode: 'cover' },
  galleryTopRow: {
    position: 'absolute', left: 10, right: 10, top: 10, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  privateBadge: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  privateText: { color: COLORS.white, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  galleryCounterBox: {
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
  },
  galleryCounter: { color: COLORS.white, fontSize: 12, fontWeight: '700' },

  // overlay/menu
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 98, elevation: 8 },
  menu: {
    position: 'absolute', width: 210, borderRadius: 14, backgroundColor: COLORS.card,
    paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
    elevation: 12, zIndex: 99, borderWidth: 1, borderColor: COLORS.border,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  menuIcon: { width: 18, height: 18, marginRight: 10, resizeMode: 'contain' },
  menuText: { fontSize: 16 },
  menuDivider: { height: 1, backgroundColor: COLORS.border, opacity: 0.6, marginVertical: 4 },

  // card
  card: { marginTop: 16, marginHorizontal: 14, backgroundColor: COLORS.card, borderRadius: R, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },

  map: { height: 220, borderRadius: 18, overflow: 'hidden' },
  mapPinWrap: { position: 'absolute', left: '55%', top: '55%' },
  mapPin: { width: 28, height: 28, tintColor: COLORS.primary },

  desc: { color: COLORS.text, opacity: 0.95, marginTop: 12, fontSize: 16, lineHeight: 22 },

  smallFab: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },

  floatingShare: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    zIndex: 1, elevation: 1,
  },
});
