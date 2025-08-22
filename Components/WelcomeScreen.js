// Components/WelcomeScreen.js
import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, Animated, Dimensions, Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');

const COLORS = {
  bg:        '#0D0A1F', // общий тёмно-фиолетовый фон
  topDeep:   '#100A2E', // верх с картинкой
  primary:   '#7C3AED', // акцент (заливка прогресса)
  accent:    '#A78BFA', // светлый фиолетовый (контуры/детали)
  text:      '#EDEBFF', // светлый текст
  textMuted: '#C7C6FF',
};

const HOLD_MS = 1300;
const KNOB_H = 64;

export default function WelcomeScreen({ navigation }) {
  const [trackW, setTrackW] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const holding  = useRef(false);

  const ringScale   = progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });
  const ringOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.07, 0.22] });
  const fillW       = progress.interpolate({ inputRange: [0, 1], outputRange: [0, trackW] });
  const hintFade    = progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 0.55, 0] });

  const startHold = () => {
    holding.current = true;
    Animated.timing(progress, { toValue: 1, duration: HOLD_MS, useNativeDriver: false })
      .start(({ finished }) => { if (finished && holding.current) navigation.replace('CreateProfile'); });
  };
  const cancelHold = () => {
    holding.current = false;
    Animated.timing(progress, { toValue: 0, duration: 300, useNativeDriver: false }).start();
  };

  return (
    <View style={styles.container}>
      {/* верхняя часть с картинкой */}
      <View style={styles.topWrap}>
        <Image
          source={require('../assets/welcome_collage.webp')}
          style={styles.topImage}
          resizeMode="cover"
        />
        <LinearGradient
          pointerEvents="none"
          colors={[COLORS.topDeep, '#16103B', COLORS.bg]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topGradient}
        />
      </View>

      {/* нижняя часть — тёмный фиолетовый фон */}
      <View style={styles.bottomWrap}>
        <View style={styles.content}>
          <Image source={require('../assets/Logo.webp')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>CROVVN STORY SPOTS</Text>
          <Text style={styles.subtitle}>ON THE BERLIN MAP</Text>

          <Text style={styles.headline}>Discover Berlin Through Stories</Text>
          <Text style={styles.desc}>
            Every street, bridge, and café has something to say. Explore the city’s iconic spots — and share the moments that mattered to you.
          </Text>
        </View>

        {/* PRESS & HOLD */}
        <View style={styles.holdWrap} onLayout={e => setTrackW(e.nativeEvent.layout.width)}>
          {/* инструкция по центру, исчезает при заполнении */}
          <Animated.Text style={[styles.holdHint, { opacity: hintFade }]}>
            Press & Hold to Start
          </Animated.Text>

          {/* заливка прогресса */}
          <Animated.View style={[styles.holdFill, { width: fillW }]} />

          {/* кнопка: только корона + свечение, БЕЗ дополнительного текста */}
          <Pressable onPressIn={startHold} onPressOut={cancelHold} style={styles.holdBtn}>
            <Animated.View style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
          
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // верх
  topWrap: { backgroundColor: COLORS.topDeep, width: '100%', height: '46%' },
  topImage: { width: '100%', height: '100%' },
  topGradient: {
    position: 'absolute', left: 0, right: 0, bottom: -1,
    height: Math.round(SCREEN_W * 0.035), zIndex: 2,
  },

  // низ
  bottomWrap: { flex: 1, backgroundColor: COLORS.bg },

  content: { padding: 20, alignItems: 'center' },
  logo: { width: 72, height: 72, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
  headline: { fontSize: 20, color: COLORS.text, textAlign: 'center', marginBottom: 10 },
  desc: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },

  // hold-кнопка
  holdWrap: {
    height: KNOB_H, marginHorizontal: 20, marginBottom: 40,
    borderRadius: KNOB_H / 2, backgroundColor: '#1C1536',
    overflow: 'hidden', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2C2255',
  },
  holdFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: COLORS.primary,
  },
  holdHint: {
    position: 'absolute', width: '100%', textAlign: 'center',
    color: COLORS.text, fontWeight: '800', letterSpacing: 0.4,
  },
  holdBtn: {
    height: KNOB_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: KNOB_H + 26, height: KNOB_H + 26, borderRadius: (KNOB_H + 26) / 2,
    borderWidth: 6, borderColor: COLORS.accent,
  },
  holdIcon: { width: 28, height: 28 },
});
