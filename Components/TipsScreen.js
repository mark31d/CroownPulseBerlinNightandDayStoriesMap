// Components/TipsScreen.js (Settings)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  Switch,
  Share,
  Alert,
  Linking,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  bg:      '#0D0A1F',  // общий тёмно-фиолетовый
  text:    '#EDEBFF',  // основной текст
  muted:   '#B7B5E8',  // плейсхолдер/вторичный
  card:    '#111028',  // карточки/ряды
  input:   '#1C1536',  // поля ввода / неактивный трек
  border:  '#2C2255',  // бордеры
  primary: '#4C1D95',  // фиолет-900 (актив)
  accent:  '#A78BFA',  // светлый акцент
  danger:  '#EF4444',  // опасные действия
  white:   '#FFFFFF',
};

const KEY_NAME   = 'profileName';
const KEY_PHOTO  = 'profilePhoto';
const KEY_NOTIF  = 'notificationsEnabled';
const KEY_SAVED  = 'saved_spots';
const KEY_STORY  = 'stories';

export default function TipsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [name, setName]       = useState('Mark');
  const [photo, setPhoto]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [notif, setNotif]     = useState(true);

  // загрузка профиля + notif
  useEffect(() => {
    (async () => {
      try {
        const [[, n], [, p], [, en]] = await AsyncStorage.multiGet([
          KEY_NAME, KEY_PHOTO, KEY_NOTIF,
        ]);
        if (n && n.trim()) setName(n.trim());
        if (p) setPhoto(p);
        if (en != null) setNotif(en === 'true');
      } catch {}
    })();
  }, []);

  const saveName = async () => {
    try {
      await AsyncStorage.setItem(KEY_NAME, name.trim() || 'User');
      setEditing(false);
    } catch {}
  };

  const toggleNotif = async (val) => {
    setNotif(val);
    try { await AsyncStorage.setItem(KEY_NOTIF, String(val)); } catch {}
  };

  const pickPhoto = async () => {
    Alert.alert(
      'Add photo',
      'Подключи image picker или переиспользуй CreateProfile.',
      [
        { text: 'Open CreateProfile', onPress: () => navigation.navigate('CreateProfile') },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  // НОВОЕ #1: экспорт локальных данных в JSON и шаринг
  const exportData = async () => {
    try {
      const entries = await AsyncStorage.multiGet([KEY_NAME, KEY_PHOTO, KEY_NOTIF, KEY_SAVED, KEY_STORY]);
      const map = Object.fromEntries(entries);
      const parse = (v) => {
        try { return JSON.parse(v ?? 'null') } catch { return v }
      };
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: {
          name: map[KEY_NAME] || '',
          photo: map[KEY_PHOTO] || '',
          notificationsEnabled: map[KEY_NOTIF] === 'true',
        },
        saved_spots: parse(map[KEY_SAVED]) || {},
        stories: parse(map[KEY_STORY]) || [],
      };
      await Share.share({
        title: 'CROVVN backup',
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  // НОВОЕ #2: оценить приложение
  const rateApp = async () => {
    const ios  = 'itms-apps://itunes.apple.com/app/idAPP_ID?action=write-review';
    const droid = 'market://details?id=com.yourapp';
    const url = Platform.OS === 'ios' ? ios : droid;
    const ok = await Linking.canOpenURL(url);
    Linking.openURL(ok ? url : (Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/idAPP_ID'
      : 'https://play.google.com/store/apps/details?id=com.yourapp'));
  };

  const openSettings = () => { try { Linking.openSettings(); } catch {} };

  const resetAll = () => {
    Alert.alert(
      'Reset all data',
      'This will remove your profile, saved places and stories.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([KEY_NAME, KEY_PHOTO, KEY_NOTIF, KEY_SAVED, KEY_STORY]);
              setName('User'); setPhoto(null); setNotif(true);
              Alert.alert('Done', 'All local data has been reset.');
            } catch {}
          }
        }
      ]
    );
  };

  const openTerms = () => Linking.openURL('https://example.com/terms');

  return (
    <SafeAreaView style={styles.container} edges={['top','left','right']}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 18,
          paddingBottom: 18 + insets.bottom,
          paddingLeft: 16 + insets.left,
          paddingRight: 16 + insets.right,
        }}
      >
        <Text style={styles.header}>Settings</Text>

        {/* avatar */}
        <View style={styles.avatarWrap}>
          <Image
            source={photo ? { uri: photo } : require('../assets/crown.webp')}
            style={styles.avatar}
          />
          <Pressable onPress={pickPhoto} style={styles.avatarPlus}>
            <Image source={require('../assets/plus.webp')} style={{ width: 14, height: 14, tintColor: COLORS.white }} />
          </Pressable>
        </View>

        {/* name row */}
        <View style={styles.row}>
          <TextInput
            value={name}
            onChangeText={setName}
            editable={editing}
            placeholder="User"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, { opacity: editing ? 1 : 0.95 }]}
          />
          {editing ? (
            <Pressable onPress={saveName} style={[styles.roundBtn, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.roundEmoji}>✓</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setEditing(true)} style={[styles.roundBtn, { backgroundColor: COLORS.accent }]}>
              <Image source={require('../assets/pencil.webp')} style={[styles.roundIcon, { tintColor: COLORS.bg }]} />
            </Pressable>
          )}
        </View>

        {/* notifications */}
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Notifications</Text>
          <Switch
            value={notif}
            onValueChange={toggleNotif}
            trackColor={{ false: COLORS.input, true: COLORS.accent }}
            thumbColor={COLORS.white}
            ios_backgroundColor={COLORS.input}
          />
        </View>

        {/* export data (замена Share) */}
        <Pressable onPress={exportData} style={styles.settingRow}>
          <Text style={styles.settingText}>Export your data (JSON)</Text>
          <Image source={require('../assets/share.webp')} style={[styles.trailingIcon, { tintColor: COLORS.accent }]} />
        </Pressable>

        {/* rate app — новая кнопка */}
        <Pressable onPress={rateApp} style={styles.settingRow}>
          <Text style={styles.settingText}>Rate the app</Text>
          <Image source={require('../assets/star.webp')} style={[styles.trailingIcon, { tintColor: COLORS.accent }]} />
        </Pressable>

        {/* open app settings */}
        <Pressable onPress={openSettings} style={styles.settingRow}>
          <Text style={styles.settingText}>Open app settings</Text>
          <Image source={require('../assets/user.webp')} style={[styles.trailingIcon, { tintColor: COLORS.accent }]} />
        </Pressable>

        {/* reset */}
        <Pressable
          onPress={resetAll}
          style={[styles.settingRow, { borderColor: '#FEE2E2', borderWidth: 1, backgroundColor: COLORS.card }]}
        >
          <Text style={[styles.settingText, { color: COLORS.danger }]}>Reset all data</Text>
          <Image source={require('../assets/trash.webp')} style={[styles.trailingIcon, { tintColor: COLORS.danger }]} />
        </Pressable>

        {/* terms */}
        <Pressable onPress={openTerms} style={styles.settingRow}>
          <Text style={styles.settingText}>Terms of Use / Privacy Policy</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const R = 24;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { color: COLORS.accent, fontSize: 36, fontWeight: '800', marginBottom: 12 },

  avatarWrap: { alignSelf: 'center', marginTop: 8, marginBottom: 18 },
  avatar: { width: 144, height: 144, borderRadius: 72, backgroundColor: COLORS.input },
  avatarPlus: {
    position: 'absolute', right: 10, bottom: 8,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  input: {
    flex: 1,
    height: 56,
    borderRadius: R,
    paddingHorizontal: 16,
    backgroundColor: COLORS.input,
    color: COLORS.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roundBtn: {
    width: 56, height: 56, marginLeft: 10,
    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
  },
  roundIcon: { width: 18, height: 18, resizeMode: 'contain' },
  roundEmoji: { color: COLORS.white, fontSize: 18, fontWeight: '800' },

  settingRow: {
    minHeight: 64,
    borderRadius: R,
    backgroundColor: COLORS.card,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },

  trailingIcon: { width: 20, height: 20, resizeMode: 'contain' },
});
