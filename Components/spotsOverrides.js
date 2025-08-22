// Components/spotsOverrides.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'spot_overrides'; // { [spotId]: {title, description, categoryLabel, rating, ...} }

export async function getAllOverrides() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getOverride(spotId) {
  const all = await getAllOverrides();
  return all?.[spotId] || null;
}

export async function setOverride(spotId, patch) {
  const all = await getAllOverrides();
  const next = {
    ...all,
    [spotId]: { ...(all[spotId] || {}), ...patch },
  };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

// Утилита: применить оверрайды к объекту спота
export async function withOverrides(spot) {
  if (!spot?.id) return spot;
  const patch = await getOverride(spot.id);
  return patch ? { ...spot, ...patch } : spot;
}
