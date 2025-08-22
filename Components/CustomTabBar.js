// Components/CustomTabBar.js
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Animated, Dimensions, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  bg:      '#080615',                 // ещё темнее фон под «таблеткой»
  primary: '#4C1D95',                 // фиолетовый-900 для активного круга
  accent:  '#7C3AED',                 // доп. оттенок (необяз.)
  border:  '#2A1F4F',                 // тёмный лавандовый бордер
  surface: '#FFFFFF',                 // белая «таблетка» для контраста
  iconDim: 'rgba(76,29,149,0.65)',    // приглушённые иконки
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  const [pillWidth, setPillWidth] = useState(SCREEN_WIDTH);
  const tabWidth = useMemo(
    () => (pillWidth > 0 ? pillWidth / state.routes.length : 0),
    [pillWidth, state.routes.length]
  );

  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(x, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      bounciness: 10,
    }).start();
  }, [state.index, tabWidth, x]);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          paddingLeft:  Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12),
        },
      ]}
    >
      <View
        style={styles.pill}
        onLayout={e => setPillWidth(e.nativeEvent.layout.width)}
      >
        {/* активный круг */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeCircle,
            { width: tabWidth, transform: [{ translateX: x }] },
          ]}
        />

        {/* кнопки */}
        {state.routes.map((route, idx) => {
          const isFocused = state.index === idx;
          const icon = getIcon(route.name);
          const tint = isFocused ? COLORS.surface : COLORS.iconDim;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, { width: tabWidth }]}
            >
              <Image
                source={icon}
                style={[
                  styles.icon,
                  route.name === 'Saved' && styles.iconCrown,
                  { tintColor: tint },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getIcon(name) {
  switch (name) {
    case 'Locations':
      return require('../assets/temple.webp');
    case 'Map':
      return require('../assets/compass.webp');
    case 'AddStory':
      return require('../assets/pencil.webp');
    case 'Saved':
      return require('../assets/crown.webp');
    case 'Settings':
      return require('../assets/user.webp');
    default:
      return require('../assets/pencil.webp');
  }
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.bg,
    paddingTop: 8,
  },
  pill: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  activeCircle: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
  },
  tab: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  iconCrown: {
    width: 34,
    height: 34,
  },
});
