// Components/SavedScreen.js
import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ImageBackground, FlatList, Pressable, Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaved } from '../Components/SavedContext';
import { SPOTS } from '../Components/spotsData';

const COLORS = {
  bg:      '#0D0A1F',
  text:    '#EDEBFF',
  muted:   '#B7B5E8',
  card:    '#111028',
  border:  '#2C2255',
  primary: '#4C1D95',
  accent:  '#A78BFA',
  white:   '#FFFFFF',
};

export default function SavedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = React.useState('User');
  const [avatar, setAvatar]     = React.useState(null);
  const [sortMode, setSortMode] = React.useState('rating'); // <-- БЕЗ generic!

  const { savedMap, toggle, refreshSaved } = useSaved();

  React.useEffect(() => {
    (async () => {
      const [[, name], [, photo]] = await AsyncStorage.multiGet(['profileName', 'profilePhoto']);
      if (name && name.trim()) setUsername(name.trim());
      if (photo) setAvatar(photo);
    })();
  }, []);

  useFocusEffect(useCallback(() => { refreshSaved(); }, [refreshSaved]));

  const data = useMemo(() => SPOTS.filter(s => savedMap[s.id]), [savedMap]);

  const sortedData = useMemo(() => {
    const arr = [...data];
    if (sortMode === 'rating') {
      arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || String(a.title).localeCompare(String(b.title)));
    } else {
      arr.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    }
    return arr;
  }, [data, sortMode]);

  const openDetails = (item) => navigation.navigate('LocationDetails', { item });

  const openAllOnMap = () => {
    if (!sortedData.length) return;
    navigation.navigate('Map', { points: sortedData });
  };

  const shareList = async () => {
    const list = sortedData.slice(0, 10).map((s, i) => `${i + 1}. ${s.title}`).join('\n');
    try {
      await Share.share({ title: 'My saved Berlin spots', message: `My saved Berlin spots:\n\n${list}` });
    } catch {}
  };

  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top','left','right']}>
        <View style={[styles.header, { paddingHorizontal: 16 + insets.left }]}>
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

        <Text style={[styles.title, { paddingHorizontal: 16 + insets.left }]}>Your Mark on the Map</Text>

        <View style={[styles.emptyWrap, { paddingHorizontal: 16 + insets.left, paddingBottom: insets.bottom + 12 }]}>
          <Image source={require('../assets/crown.webp')} style={{ width: 76, height: 76, tintColor: COLORS.accent, marginBottom: 18 }} />
          <Text style={styles.emptyText}>You haven’t saved any locations yet</Text>

          <Pressable onPress={() => navigation.navigate('Locations')} style={styles.exploreBtn}>
            <Text style={styles.exploreText}>Explore</Text>
            <Image source={require('../assets/chevrons.webp')} style={styles.exploreIcon} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <View style={[styles.header, { paddingHorizontal: 16 + insets.left }]}>
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

      <Text style={[styles.title, { paddingHorizontal: 16 + insets.left }]}>Your Mark on the Map</Text>

      {/* Quick actions */}
      <View style={[styles.quickRow, { paddingHorizontal: 16 + insets.left }]}>
        <Pressable onPress={openAllOnMap} style={styles.quickBtn}>
          <Image source={require('../assets/point.webp')} style={[styles.quickIcon, { tintColor: COLORS.bg }]} />
          <Text style={styles.quickText}>Open on Map</Text>
        </Pressable>
        <Pressable
          onPress={() => setSortMode(m => (m === 'rating' ? 'title' : 'rating'))}
          style={[styles.quickBtn, { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }]}
        >
          <Text style={[styles.quickText, { color: COLORS.text }]}>
            Sort: {sortMode === 'rating' ? 'Rating' : 'Title'}
          </Text>
        </Pressable>
        <Pressable onPress={shareList} style={[styles.quickBtn, { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }]}>
          <Image source={require('../assets/share.webp')} style={[styles.quickIcon, { tintColor: COLORS.accent }]} />
          <Text style={[styles.quickText, { color: COLORS.text }]}>Share</Text>
        </Pressable>
      </View>

      <FlatList
        data={sortedData}
        keyExtractor={(i) => String(i.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 28 + insets.bottom,
          paddingLeft: 16 + insets.left,
          paddingRight: 16 + insets.right,
        }}
        renderItem={({ item }) => {
          const isSaved = !!savedMap[item.id];
          return (
            <View style={styles.cardWrap}>
              <ImageBackground source={item.image} style={styles.cardImage} imageStyle={styles.cardImageRadius}>
                <View style={styles.cardTopRow}>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingStar}>⭐</Text>
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>

                  <Pressable onPress={() => toggle(item.id)} style={styles.bookmarkBtn} hitSlop={8}>
                    <Image
                      source={require('../assets/crown.webp')}
                      style={[
                        styles.bookmarkIcon,
                        { tintColor: isSaved ? COLORS.accent : COLORS.white, opacity: isSaved ? 1 : 0.95 },
                      ]}
                    />
                  </Pressable>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.cardCategory}>{item.categoryLabel}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>

                <Pressable onPress={() => navigation.navigate('LocationDetails', { item })} style={styles.goBtn}>
                  <Image source={require('../assets/chevrons.webp')} style={[styles.goIcon, { tintColor: COLORS.white }]} />
                </Pressable>
                <Pressable onPress={() => navigation.navigate('AddStory', { spot: item })} style={styles.storyBtn} hitSlop={8}>
                  <Image source={require('../assets/pencil.webp')} style={[styles.storyIcon, { tintColor: COLORS.bg }]} />
                </Pressable>

                <View style={styles.cardOverlay} />
              </ImageBackground>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { paddingTop: 10, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  brandEmoji: { fontSize: 22, marginLeft: 12, includeFontPadding: false },

  helloMuted: { color: COLORS.muted, fontSize: 14 },
  hello: { color: COLORS.text, fontSize: 24, fontWeight: '700' },

  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginTop: 14 },

  quickRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickBtn: {
    flex: 1, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', flexDirection: 'row',
  },
  quickIcon: { width: 16, height: 16, marginRight: 8, resizeMode: 'contain' },
  quickText: { color: COLORS.white, fontWeight: '800' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 16, marginBottom: 14, textAlign: 'center' },

  exploreBtn: {
    marginTop: 8, height: 56, paddingHorizontal: 22, borderRadius: 28,
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  exploreText: { color: COLORS.white, fontSize: 18, fontWeight: '800', marginRight: 8 },
  exploreIcon: { width: 20, height: 20, tintColor: COLORS.white, resizeMode: 'contain' },

  cardWrap: { marginTop: 14 },
  cardImage: { height: 240, borderRadius: 20, overflow: 'hidden' },
  cardImageRadius: { borderRadius: 20 },

  cardTopRow: {
    position: 'absolute', top: 12, left: 12, right: 12, zIndex: 2,
    flexDirection: 'row', justifyContent: 'space-between',
  },

  ratingBadge: {
    paddingVertical: 10, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, borderRadius: 25,
    backgroundColor: 'rgba(13,10,31,0.55)',
    borderColor: COLORS.white, borderWidth: 1,
  },
  ratingStar: { fontSize: 14, marginRight: 6, color: COLORS.white },
  ratingText: { color: COLORS.white, fontWeight: '700' },

  bookmarkBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(13,10,31,0.55)',
    justifyContent: 'center', alignItems: 'center',
    borderColor: COLORS.white, borderWidth: 1,
  },
  bookmarkIcon: { width: 40, height: 40, resizeMode: 'contain' },

  cardBottom: { position: 'absolute', left: 16, right: 90, bottom: 20, zIndex: 2 },
  cardCategory: { color: COLORS.white, opacity: 0.95, marginBottom: 6, fontSize: 13, fontWeight: '600' },
  cardTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800' },

  goBtn: {
    position: 'absolute', right: 16, bottom: 16, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', zIndex: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  goIcon: { width: 22, height: 22, resizeMode: 'contain' },

  storyBtn: {
    position: 'absolute', right: 16, bottom: 82, width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center', zIndex: 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  storyIcon: { width: 18, height: 18, resizeMode: 'contain' },

  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
});
