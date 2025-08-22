// Components/DiaryContext.js
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from 'react';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  
  export const STORIES_KEY = 'stories';
  
  const DiaryContext = createContext({
    ready: false,
    stories: [],                 // [{ id, title, description, cover, lat, lng, locationTitle, categoryLabel, createdAt }]
    refreshStories: async () => {},
    addStory: async (_story) => {},
    updateStory: async (_story) => {},
    deleteStory: async (_id) => {},
    clearStories: async () => {},
    getById: (_id) => undefined,
    setStories: async (_arr) => {},
  });
  
  function genId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  
  export function DiaryProvider({ children }) {
    const [ready, setReady] = useState(false);
    const [stories, setStoriesState] = useState([]);
  
    const loadFromStorage = useCallback(async () => {
      try {
        const raw = await AsyncStorage.getItem(STORIES_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        // отсортируем по дате (свежие сверху), если есть createdAt
        arr.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
        setStoriesState(arr);
      } catch {
        setStoriesState([]);
      } finally {
        setReady(true);
      }
    }, []);
  
    useEffect(() => {
      loadFromStorage();
    }, [loadFromStorage]);
  
    const persist = useCallback(async (arr) => {
      setStoriesState(arr);
      try {
        await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(arr));
      } catch {}
    }, []);
  
    const refreshStories = useCallback(async () => {
      await loadFromStorage();
    }, [loadFromStorage]);
  
    const addStory = useCallback(async (story) => {
      const withId = story?.id ? story : { ...story, id: genId() };
      const withTime = withId.createdAt ? withId : { ...withId, createdAt: Date.now() };
      const next = [withTime, ...stories];
      await persist(next);
      return withTime;
    }, [stories, persist]);
  
    const updateStory = useCallback(async (updated) => {
      if (!updated?.id) return;
      const next = stories.map(s => (String(s.id) === String(updated.id) ? { ...s, ...updated } : s));
      await persist(next);
    }, [stories, persist]);
  
    const deleteStory = useCallback(async (id) => {
      const next = stories.filter(s => String(s.id) !== String(id));
      await persist(next);
    }, [stories, persist]);
  
    const clearStories = useCallback(async () => {
      await persist([]);
    }, [persist]);
  
    const getById = useCallback((id) => stories.find(s => String(s.id) === String(id)), [stories]);
  
    const setStories = useCallback(async (arr) => {
      // прямое перекрытие (например, миграции/импорт)
      await persist(Array.isArray(arr) ? arr : []);
    }, [persist]);
  
    const value = useMemo(() => ({
      ready,
      stories,
      refreshStories,
      addStory,
      updateStory,
      deleteStory,
      clearStories,
      getById,
      setStories,
    }), [ready, stories, refreshStories, addStory, updateStory, deleteStory, clearStories, getById, setStories]);
  
    return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
  }
  
  export function useDiary() {
    return useContext(DiaryContext);
  }
  