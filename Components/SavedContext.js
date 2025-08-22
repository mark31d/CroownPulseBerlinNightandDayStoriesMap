// Components/SavedContext.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SAVED_KEY = 'saved_spots'; // формат: { [spotId]: true }

const SavedContext = createContext({
  ready: false,
  savedMap: {},
  isSaved: (_id) => false,
  toggle: async (_id) => {},
  setSaved: async (_id, _value) => {},
  clearAllSaved: async () => {},
  refreshSaved: async () => {},
});

export function SavedProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [savedMap, setSavedMap] = useState({});

  const refreshSaved = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_KEY);
      setSavedMap(raw ? JSON.parse(raw) : {});
    } catch {
      setSavedMap({});
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  const persist = useCallback(async (next) => {
    setSavedMap(next);
    try {
      const compact = Object.fromEntries(Object.entries(next).filter(([, v]) => !!v));
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(compact));
    } catch {}
  }, []);

  const isSaved = useCallback((id) => !!savedMap?.[id], [savedMap]);

  const setSaved = useCallback(async (id, value) => {
    const next = { ...savedMap, [id]: !!value };
    if (!value) delete next[id];
    await persist(next);
  }, [savedMap, persist]);

  const toggle = useCallback(async (id) => {
    const nextVal = !savedMap?.[id];
    const next = { ...savedMap, [id]: nextVal };
    if (!nextVal) delete next[id];
    await persist(next);
  }, [savedMap, persist]);

  const clearAllSaved = useCallback(async () => {
    setSavedMap({});
    try { await AsyncStorage.setItem(SAVED_KEY, JSON.stringify({})); } catch {}
  }, []);

  const value = useMemo(() => ({
    ready, savedMap, isSaved, toggle, setSaved, clearAllSaved, refreshSaved,
  }), [ready, savedMap, isSaved, toggle, setSaved, clearAllSaved, refreshSaved]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  return useContext(SavedContext);
}
