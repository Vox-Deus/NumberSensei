import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GameState,
  LevelParams,
  LevelResult,
  PlayerStats,
  SkillMetrics,
  GuessResult,
  PlayerProfile,
  LevelParams as LevelType,
} from "./types";
import {
  createInitialStats,
  createInitialSkillMetrics,
  updateStatsWithResult,
  calculateSkillMetrics,
  calculateLevelAccuracy,
  calculateLevelAccuracy as calcAccuracy,
} from "./skill-model";
import { generateLevel, getHint } from "./level-generator";

const STORAGE_KEYS = {
  STATS: "brain_cubes_stats",
  METRICS: "brain_cubes_metrics",
  HISTORY: "brain_cubes_history",
  PROFILE: "brain_cubes_profile",
  LEVEL_NUMBER: "brain_cubes_level_number",
};

interface GameContextValue {
  gameState: GameState;
  playerStats: PlayerStats;
  skillMetrics: SkillMetrics;
  levelHistory: LevelResult[];
  profile: PlayerProfile;
  
  startNewGame: () => void;
  continueGame: () => void;
  makeGuess: (guess: number) => GuessResult;
  pauseGame: () => void;
  resumeGame: () => void;
  restartLevel: () => void;
  goToMainMenu: () => void;
  
  updateProfile: (updates: Partial<PlayerProfile>) => void;
  resetProgress: () => void;
  
  hasSavedGame: boolean;
  currentLevelNumber: number;
}

const GameContext = createContext<GameContextValue | null>(null);

const initialGameState: GameState = {
  currentLevel: null,
  currentGuesses: [],
  isPlaying: false,
  isPaused: false,
  startTime: null,
  elapsedTime: 0,
};

const initialProfile: PlayerProfile = {
  displayName: "Player",
  avatarId: 0,
  soundEnabled: true,
  hapticsEnabled: true,
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(createInitialStats);
  const [skillMetrics, setSkillMetrics] = useState<SkillMetrics>(createInitialSkillMetrics);
  const [levelHistory, setLevelHistory] = useState<LevelResult[]>([]);
  const [profile, setProfile] = useState<PlayerProfile>(initialProfile);
  const [currentLevelNumber, setCurrentLevelNumber] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [stats, metrics, history, prof, levelNum] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.STATS),
          AsyncStorage.getItem(STORAGE_KEYS.METRICS),
          AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.LEVEL_NUMBER),
        ]);

        if (stats) setPlayerStats(JSON.parse(stats));
        if (metrics) setSkillMetrics(JSON.parse(metrics));
        if (history) setLevelHistory(JSON.parse(history));
        if (prof) setProfile(JSON.parse(prof));
        if (levelNum) setCurrentLevelNumber(parseInt(levelNum, 10));
      } catch (error) {
        console.error("Failed to load game data", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (!isLoaded) return;
    const saveData = async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(playerStats)),
          AsyncStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(skillMetrics)),
          AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(levelHistory)),
          AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile)),
          AsyncStorage.setItem(STORAGE_KEYS.LEVEL_NUMBER, currentLevelNumber.toString()),
        ]);
      } catch (error) {
        console.error("Failed to save game data", error);
      }
    };
    saveData();
  }, [playerStats, skillMetrics, levelHistory, profile, currentLevelNumber, isLoaded]);

  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused && gameState.startTime) {
      timerRef.current = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          elapsedTime: Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000),
        }));
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.startTime]);
  
  const triggerHaptic = useCallback((type: "success" | "error" | "light") => {
    if (!profile.hapticsEnabled) return;
    
    switch (type) {
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  }, [profile.hapticsEnabled]);
  
  const startNewGame = useCallback(() => {
    const newLevel = generateLevel(1, skillMetrics);
    setCurrentLevelNumber(1);
    setGameState({
      currentLevel: newLevel,
      currentGuesses: [],
      isPlaying: true,
      isPaused: false,
      startTime: Date.now(),
      elapsedTime: 0,
    });
  }, [skillMetrics]);
  
  const continueGame = useCallback(() => {
    if (gameState.currentLevel && !gameState.isPlaying) {
      const won = gameState.currentGuesses.some(g => g.feedback === "correct");
      if (won) {
        // Move to next level
        const nextLevel = generateLevel(currentLevelNumber + 1, skillMetrics);
        setCurrentLevelNumber(prev => prev + 1);
        setGameState({
          currentLevel: nextLevel,
          currentGuesses: [],
          isPlaying: true,
          isPaused: false,
          startTime: Date.now(),
          elapsedTime: 0,
        });
      } else {
        // Resume current level if it wasn't a loss (e.g. from main menu)
        setGameState(prev => ({
          ...prev,
          isPlaying: true,
          isPaused: false,
          startTime: Date.now() - prev.elapsedTime * 1000,
        }));
      }
    } else if (!gameState.currentLevel) {
      startNewGame();
    }
  }, [gameState, currentLevelNumber, skillMetrics, startNewGame]);
  
  const completeLevel = useCallback((won: boolean) => {
    if (!gameState.currentLevel) return;
    
    const result: LevelResult = {
      levelNumber: currentLevelNumber,
      won,
      attemptsUsed: gameState.currentGuesses.length,
      maxAttempts: gameState.currentLevel.maxAttempts,
      timeUsed: gameState.elapsedTime,
      timeLimit: gameState.currentLevel.timeLimit,
      accuracy: calculateLevelAccuracy(
        gameState.currentGuesses.length,
        gameState.currentLevel.maxAttempts,
        gameState.currentLevel.rangeMax - gameState.currentLevel.rangeMin + 1
      ),
      gameMode: gameState.currentLevel.gameMode,
      targetNumber: gameState.currentLevel.targetNumber,
      guesses: gameState.currentGuesses,
      completedAt: Date.now(),
    };
    
    const newHistory = [...levelHistory, result];
    setLevelHistory(newHistory);
    
    const newStats = updateStatsWithResult(playerStats, result);
    setPlayerStats(newStats);
    
    const newMetrics = calculateSkillMetrics(newStats, newHistory);
    setSkillMetrics(newMetrics);
    
    if (won) {
      triggerHaptic("success");
      const nextLevel = generateLevel(currentLevelNumber + 1, newMetrics);
      // We don't increment level number or change level yet, 
      // the screen will call continueGame() which will handle it
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        startTime: null,
      }));
    } else {
      triggerHaptic("error");
      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        startTime: null,
      }));
    }
  }, [gameState, currentLevelNumber, levelHistory, playerStats, triggerHaptic]);
  
  const makeGuess = useCallback((guess: number): GuessResult => {
    if (!gameState.currentLevel || !gameState.isPlaying) {
      return { guess, feedback: "lower", timestamp: Date.now() };
    }
    
    triggerHaptic("light");
    
    const target = gameState.currentLevel.targetNumber;
    
    if (guess === target) {
      const result: GuessResult = {
        guess,
        feedback: "correct",
        timestamp: Date.now(),
      };
      
      setGameState(prev => ({
        ...prev,
        currentGuesses: [...prev.currentGuesses, result],
      }));
      
      setTimeout(() => completeLevel(true), 500);
      
      return result;
    }
    
    const hintData = getHint(
      guess,
      target,
      gameState.currentLevel.hintStyle,
      gameState.currentLevel.maxAttempts - gameState.currentGuesses.length - 1
    );
    
    const result: GuessResult = {
      guess,
      feedback: hintData.feedback,
      hint: hintData.hint,
      penalty: hintData.penalty,
      timestamp: Date.now(),
    };
    
    const newGuesses = [...gameState.currentGuesses, result];
    
    setGameState(prev => ({
      ...prev,
      currentGuesses: newGuesses,
    }));
    
    if (newGuesses.length >= gameState.currentLevel.maxAttempts) {
      setTimeout(() => completeLevel(false), 500);
    }
    
    return result;
  }, [gameState, triggerHaptic, completeLevel]);
  
  const pauseGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameState(prev => ({ ...prev, isPaused: true }));
  }, []);
  
  const resumeGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: false,
      startTime: Date.now() - prev.elapsedTime * 1000,
    }));
  }, []);
  
  const restartLevel = useCallback(() => {
    if (!gameState.currentLevel) return;
    
    const newLevel = generateLevel(currentLevelNumber, skillMetrics, gameState.currentLevel.seed + 1);
    setGameState({
      currentLevel: newLevel,
      currentGuesses: [],
      isPlaying: true,
      isPaused: false,
      startTime: Date.now(),
      elapsedTime: 0,
    });
  }, [gameState.currentLevel, currentLevelNumber, skillMetrics]);
  
  const goToMainMenu = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
    }));
  }, []);
  
  const updateProfile = useCallback((updates: Partial<PlayerProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);
  
  const resetProgress = async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      setPlayerStats(createInitialStats());
      setSkillMetrics(createInitialSkillMetrics());
      setLevelHistory([]);
      setCurrentLevelNumber(1);
      setGameState(initialGameState);
    } catch (error) {
      console.error("Failed to reset progress", error);
    }
  };
  
  const hasSavedGame = gameState.currentLevel !== null && !gameState.isPlaying;
  
  if (!isLoaded) return null;

  return (
    <GameContext.Provider
      value={{
        gameState,
        playerStats,
        skillMetrics,
        levelHistory,
        profile,
        startNewGame,
        continueGame,
        makeGuess,
        pauseGame,
        resumeGame,
        restartLevel,
        goToMainMenu,
        updateProfile,
        resetProgress,
        hasSavedGame,
        currentLevelNumber,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
