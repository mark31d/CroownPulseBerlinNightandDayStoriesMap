// Components/CreateProfile.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

const COLORS = {
  bg:       '#0D0A1F', // общий тёмно-фиолетовый
  primary:  '#7C3AED', // основная фиолетовая
  accent:   '#A78BFA', // светлая фиолетовая
  input:    '#1C1536', // фон инпутов/карточек
  border:   '#2C2255', // бордеры
  text:     '#EDEBFF', // основной текст
  muted:    '#C7C6FF', // плейсхолдеры/вторичный
  white:    '#FFFFFF',
  black:    '#000000',
};

export default function CreateProfile({ navigation }) {
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState(null);

  const pickImage = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    if (!res.didCancel && res?.assets?.[0]?.uri) {
      setPhotoUri(res.assets[0].uri);
    }
  };

  const onSkip = async () => {
    await AsyncStorage.multiSet([['profileName', ''], ['profilePhoto', '']]);
    navigation.replace('MainTabs');
  };

  const onStart = async () => {
    await AsyncStorage.multiSet([
      ['profileName', name.trim()],
      ['profilePhoto', photoUri ?? ''],
    ]);
    navigation.replace('MainTabs');
  };

  const canStart = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* SKIP */}
      <Pressable onPress={onSkip} style={styles.skipBtn} hitSlop={8}>
        <Text style={styles.skipText}>SKIP</Text>
      </Pressable>

      {/* Заголовок */}
      <Text style={styles.title}>Your Story Starts with{'\n'}a Name</Text>

      {/* Аватар */}
      <Pressable onPress={pickImage} style={styles.avatarWrap}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]} accessible accessibilityLabel="App logo placeholder">
            <Image
              source={require('../assets/Logo.webp')}
              style={styles.avatarLogo}
              resizeMode="contain"
            />
          </View>
        )}
        <View style={styles.plusBadge}>
          <Text style={styles.plusText}>＋</Text>
        </View>
      </Pressable>

      {/* Поле никнейма */}
      <View style={styles.inputWrap}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nickname"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          returnKeyType="done"
          autoCapitalize="words"
        />
      </View>

      {/* Кнопка старт */}
      <Pressable
        onPress={onStart}
        disabled={!canStart}
        style={({ pressed }) => [
          styles.cta,
          { opacity: canStart ? (pressed ? 0.9 : 1) : 0.5 },
        ]}
      >
        <Text style={styles.ctaText}>Get Started  »</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 28,
    paddingHorizontal: 24,
  },

  // top actions
  skipBtn: { alignSelf: 'flex-start', marginTop: 12, marginBottom: 8 },
  skipText: { color: COLORS.accent, opacity: 0.95, fontSize: 14, letterSpacing: 1 },

  // title
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    marginTop: 8,
    marginBottom: 28,
    textAlign: 'left',
  },

  // avatar
  avatarWrap: { alignSelf: 'center', marginBottom: 24 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: {
    backgroundColor: COLORS.input,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLogo: {
    width: AVATAR_SIZE * 0.55,
    height: AVATAR_SIZE * 0.55,
    // при желании можно добавить оттенок:
    // tintColor: COLORS.accent,
  },
  plusBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plusText: { color: COLORS.black, fontSize: 20, fontWeight: '700' },

  // input
  inputWrap: {
    backgroundColor: COLORS.input,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    color: COLORS.text,
    fontSize: 16,
  },

  // CTA
  cta: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
});
