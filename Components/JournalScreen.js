// Components/JournalScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, FlatList, Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiary } from '../Components/DiaryContext';

const COLORS = {
  bg:      '#0D0A1F',  // общий тёмно-фиолетовый фон
  text:    '#EDEBFF',  // основной текст
  muted:   '#B7B5E8',  // вторичный текст
  primary: '#4C1D95',  // акцент/кнопки (фиолет-900)
  accent:  '#A78BFA',  // доп. акцент (светлая фиолетовая)
  card:    '#111028',  // фон карточек
  border:  '#2C2255',  // бордеры
  white:   '#FFFFFF',
};

export default function JournalScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('User');
  const [avatar, setAvatar]     = useState(null);

  const { stories, refreshStories } = useDiary();

  useEffect(() => {
    (async () => {
      const [[, name], [, photo]] = await AsyncStorage.multiGet(['profileName', 'profilePhoto']);
      if (name && name.trim()) setUsername(name.trim());
      if (photo) setAvatar(photo);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStories();
    }, [refreshStories])
  );

  const empty = useMemo(() => !stories || stories.length === 0, [stories]);

  const renderCard = ({ item }) => {
    const coverSrc = item?.cover
      ? (typeof item.cover === 'string' ? { uri: item.cover } : item.cover)
      : require('../assets/Logo.webp');

    return (
      <Pressable
        onPress={() => navigation.navigate('StoryDetails', { story: item })}
        style={styles.card}
      >
        <Image source={coverSrc} style={styles.cardImg} />
        <Text numberOfLines={1} style={styles.cardTitle}>
          {item.title || 'Untitled'}
        </Text>
        {!!item.locationTitle && (
          <Text numberOfLines={1} style={styles.cardSub}>{item.locationTitle}</Text>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right }
        ]}
      >
        <View style={styles.userRow}>
          <Image
            source={avatar ? { uri: avatar } : require('../assets/crown.webp')}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.helloMuted}>Welcome back,</Text>
            <Text style={styles.hello}>{username || 'User'}!</Text>
          </View>
          <Text
            accessibilityRole="image"
            accessibilityLabel="waving hand"
            style={styles.brandEmoji}
          >
            👋
          </Text>
        </View>

        <Text style={styles.title}>Stories from Berlin</Text>
      </View>

      {/* Empty state / grid */}
      {empty ? (
        <View style={[styles.empty, { paddingBottom: insets.bottom + 12 }]}>
          <Image source={require('../assets/crown.webp')} style={styles.emptyLogo} />
          <Text style={styles.emptyText}>No stories here yet.</Text>
          <Text style={styles.emptyText2}>
            Be the first to share what you've seen, felt, or discovered.
          </Text>

          <Pressable
            onPress={() => navigation.navigate('AddStory')}
            style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Image source={require('../assets/plus.webp')} style={[styles.addIcon, { tintColor: COLORS.bg }]} />
            <Text style={styles.addText}>Add Your Story</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={stories}
            keyExtractor={(i) => String(i.id)}
            numColumns={2}
            contentContainerStyle={{
              paddingLeft: 16 + insets.left,
              paddingRight: 16 + insets.right,
              paddingBottom: 120 + insets.bottom,
            }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={renderCard}
            showsVerticalScrollIndicator={false}
          />

          {/* FAB */}
          <Pressable
            onPress={() => navigation.navigate('AddStory')}
            style={({ pressed }) => [
              styles.fab,
              {
                opacity: pressed ? 0.9 : 1,
                right: 18 + insets.right,
                bottom: 26 + insets.bottom,
              },
            ]}
          >
            <Image source={require('../assets/plus.webp')} style={[styles.fabIcon, { tintColor: COLORS.white }]} />
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}

const CARD_R = 18;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { paddingTop: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: COLORS.card },
  brandEmoji: { fontSize: 22, marginLeft: 12, includeFontPadding: false },

  helloMuted: { color: COLORS.muted, fontSize: 14 },
  hello: { color: COLORS.text, fontSize: 24, fontWeight: '700' },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '700', marginTop: 14 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyLogo: { width: 120, height: 120, resizeMode: 'contain', marginBottom: 14,  },
  emptyText: { color: COLORS.text, fontSize: 18, marginBottom: 4 },
  emptyText2: { color: COLORS.muted, textAlign: 'center', lineHeight: 20, marginBottom: 18 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.accent, height: 56, paddingHorizontal: 18,
    borderRadius: 28, borderWidth: 1, borderColor: COLORS.border,
  },
  addIcon: { width: 18, height: 18, resizeMode: 'contain', marginRight: 10 },
  addText: { color: COLORS.bg, fontSize: 18, fontWeight: '800' },

  card: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: CARD_R,
    marginTop: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImg: { width: '100%', height: 170, resizeMode: 'cover' },
  cardTitle: { color: COLORS.text, fontWeight: '700', fontSize: 14, marginTop: 8, marginHorizontal: 10, marginBottom: 2 },
  cardSub: { color: COLORS.muted, fontSize: 12, marginHorizontal: 10, marginBottom: 10 },

  fab: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabIcon: { width: 22, height: 22, resizeMode: 'contain' },
});
