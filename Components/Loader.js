// Components/Loader.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  bg:        '#0F0A1F', // тёмный фиолетовый фон
  crown:     '#7447FF', // основной фиолетовый (корона/акцент)
  crownSoft: '#BCA7FF', // лиловый (вторичный)
  ring:      '#3C2A78', // цвет кольца
  text:      '#EFEAFF', // светлый текст
  dotDim:    'rgba(116,71,255,0.25)',
};

export default function Loader({ navigation, onFinish, delay = 3000 }) {
  const { width, height } = useWindowDimensions();

  // анимации
  const orbit = useRef(new Animated.Value(0)).current;     // вращение «искры» по орбите
  const glow  = useRef(new Animated.Value(0)).current;     // «дыхание» короны
  const d1    = useRef(new Animated.Value(0)).current;     // точки-индикаторы
  const d2    = useRef(new Animated.Value(0)).current;
  const d3    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // орбита вокруг короны
    Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // корона «дышит»
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900,  easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 900,  easing: Easing.in(Easing.quad),  useNativeDriver: true }),
      ])
    ).start();

    // бегущие точки
    const wave = (v, delayMs) => Animated.loop(Animated.sequence([
      Animated.delay(delayMs),
      Animated.timing(v, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.delay(250),
    ])).start();

    wave(d1, 0);
    wave(d2, 200);
    wave(d3, 400);

    const t = setTimeout(() => {
      if (onFinish) onFinish();
      else navigation?.replace?.('Welcome');
    }, delay);
    return () => clearTimeout(t);
  }, [navigation, onFinish, delay, orbit, glow, d1, d2, d3]);

  // производные
  const rotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const crownScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const crownOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] });

  return (
    <SafeAreaView style={[styles.container, { width, height }]} edges={['top', 'left', 'right']}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      {/* ЛОГО-БЛОК */}
      <View style={styles.logoWrap}>
        {/* статичное кольцо */}
        <View style={styles.ring} />

        {/* искра по кругу */}
        <Animated.View style={[
          styles.sparkWrap,
          { transform: [{ rotate }] }
        ]}>
          <View style={styles.spark} />
        </Animated.View>

        {/* корона */}
        <Animated.View style={{ transform: [{ scale: crownScale }], opacity: crownOpacity }}>
          <Image
            source={require('../assets/Logo.webp')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* ТЕКСТ */}
      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <Text style={styles.titleTop}>CROVVN CHRONICLE</Text>
        <Text style={styles.titleBottom}>THE BERLIN STORY ATLAS</Text>
      </View>

      {/* ТРИ ТОЧКИ */}
      <View style={styles.dotsRow} accessibilityRole="progressbar" accessible>
        {[d1, d2, d3].map((v, i) => (
          <Animated.View
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            style={[
              styles.dot,
              {
                transform: [{
                  translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] })
                }],
                opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
              }
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const RING_SIZE = 170;
const ORBIT_R   = (RING_SIZE / 2) - 6;
const LOGO_SIZE = 128;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  logoWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 8,
    borderColor: COLORS.ring,
    shadowColor: COLORS.crown,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: Platform.OS === 'android' ? 8 : 0,
  },

  sparkWrap: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.crown,
    transform: [{ translateY: -ORBIT_R }],
    shadowColor: COLORS.crown,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: Platform.OS === 'android' ? 6 : 0,
  },

  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    tintColor: undefined, // если png с цветом, не перекрашиваем
  },

  titleTop: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
    textAlign: 'center',
  },
  titleBottom: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.crownSoft,
    marginTop: 4,
    letterSpacing: 1,
    textAlign: 'center',
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.crown,
    shadowColor: COLORS.crown,
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
});
