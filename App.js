// App.js — минимальный набор экранов под новый флоу
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SavedProvider } from './Components/SavedContext';
import { DiaryProvider } from './Components/DiaryContext';

// --- Экраны ---
import Loader          from './Components/Loader';
import WelcomeScreen   from './Components/WelcomeScreen';
import CreateProfile   from './Components/CreateProfile';

import MainScreen      from './Components/MainScreen';       // список локаций
import LocationDetails from './Components/LocationDetails';  // детали локации (ТЕПЕРЬ В ROOT)

import MapScreen       from './Components/MapScreen';        // карта
import JournalScreen   from './Components/JournalScreen';    // список историй
import AddStory        from './Components/AddStory';         // форма добавления истории
import StoryDetails    from './Components/StoryDetails';     // просмотр истории

import SavedScreen     from './Components/SavedScreen';      // сохранённые
import SettingsScreen  from './Components/TipsScreen';       // настройки

import CustomTabBar from './Components/CustomTabBar';
import EditLocation from './Components/EditLocation';
const RootStack = createNativeStackNavigator();
const LocationsStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Стек «Локации» — ТОЛЬКО список
function LocationsStack() {
  return (
    <LocationsStackNav.Navigator screenOptions={{ headerShown: false }}>
      <LocationsStackNav.Screen name="LocationsHome" component={MainScreen} />
      {/* LocationDetails удалён отсюда */}
    </LocationsStackNav.Navigator>
  );
}

// Нижние вкладки
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Locations" component={LocationsStack} />
      <Tab.Screen name="Map"       component={MapScreen} />
      <Tab.Screen name="Journal"   component={JournalScreen} />
      <Tab.Screen name="Saved"     component={SavedScreen} />
      <Tab.Screen name="Settings"  component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <Loader />;

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#000000',
      card:       '#000000',
      text:       '#FFFFFF',
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      <NavigationContainer theme={theme}>
        <SavedProvider>
          <DiaryProvider>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
              {/* онбординг */}
              <RootStack.Screen name="Welcome"       component={WelcomeScreen} />
              <RootStack.Screen name="CreateProfile" component={CreateProfile} />
              {/* основные вкладки */}
              <RootStack.Screen name="MainTabs"      component={MainTabs} />
              {/* детали локации — поверх табов */}
              <RootStack.Screen
                name="LocationDetails"
                component={LocationDetails}
                // при желании можно как модалку:
                // options={{ presentation: 'modal', animation: 'slide_from_right' }}
              />
              <RootStack.Screen name="EditLocation" component={EditLocation} />
              {/* экраны поверх табов (модалки/пуши) */}
              <RootStack.Screen name="AddStory"      component={AddStory} />
              <RootStack.Screen name="StoryDetails"  component={StoryDetails} />
            </RootStack.Navigator>
          </DiaryProvider>
        </SavedProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
