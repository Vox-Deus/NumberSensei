import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeIn,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  Spacing,
  BorderRadius,
  GameModeColors,
  SemanticColors,
  Fonts,
} from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useGame } from "@/lib/game-context";
import { getModeIcon } from "@/lib/level-generator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { GameMode, GuessResult } from "@/lib/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Game">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NumberPad({
  onPress,
  onDelete,
  onSubmit,
  disabled,
}: {
  onPress: (num: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const { theme } = useTheme();
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "go"];

  const handlePress = (key: string) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === "del") {
      onDelete();
    } else if (key === "go") {
      onSubmit();
    } else {
      onPress(key);
    }
  };

  return (
    <View style={styles.numpad}>
      {keys.map((key) => (
        <Pressable
          key={key}
          onPress={() => handlePress(key)}
          disabled={disabled}
          style={({ pressed }) => [
            styles.numpadKey,
            {
              backgroundColor:
                key === "go"
                  ? GameModeColors.classic
                  : key === "del"
                  ? theme.backgroundTertiary
                  : theme.backgroundSecondary,
              opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
            },
          ]}
        >
          {key === "del" ? (
            <Feather name="delete" size={24} color={theme.text} />
          ) : key === "go" ? (
            <Feather name="check" size={24} color={theme.buttonText} />
          ) : (
            <ThemedText type="h3">{key}</ThemedText>
          )}
        </Pressable>
      ))}
    </View>
  );
}

function PauseModal({
  visible,
  onResume,
  onRestart,
  onStats,
  onMainMenu,
}: {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onStats: () => void;
  onMainMenu: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.pauseModal, { backgroundColor: theme.backgroundDefault }]}
        >
          <ThemedText type="h3" style={styles.pauseTitle}>
            Game Paused
          </ThemedText>
          <View style={styles.pauseButtons}>
            <Button onPress={onResume} style={styles.pauseButton}>
              Resume
            </Button>
            <Button
              onPress={onRestart}
              style={[styles.pauseButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              Restart Level
            </Button>
            <Button
              onPress={onStats}
              style={[styles.pauseButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              View Stats
            </Button>
            <Button
              onPress={onMainMenu}
              style={[styles.pauseButton, { backgroundColor: SemanticColors.error }]}
            >
              Main Menu
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function LevelCompleteModal({
  visible,
  won,
  attemptsUsed,
  maxAttempts,
  timeUsed,
  targetNumber,
  onContinue,
  onStats,
}: {
  visible: boolean;
  won: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  timeUsed: number;
  targetNumber: number;
  onContinue: () => void;
  onStats: () => void;
}) {
  const { theme } = useTheme();
  const iconScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      iconScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
    } else {
      iconScale.value = 0;
    }
  }, [visible]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeIn.duration(250)}
          style={[styles.completeModal, { backgroundColor: theme.backgroundDefault }]}
        >
          <Animated.View
            style={[
              styles.resultIcon,
              {
                backgroundColor: won
                  ? SemanticColors.success + "20"
                  : SemanticColors.error + "20",
              },
              iconStyle,
            ]}
          >
            <Feather
              name={won ? "check" : "x"}
              size={48}
              color={won ? SemanticColors.success : SemanticColors.error}
            />
          </Animated.View>

          <ThemedText type="h2" style={styles.resultTitle}>
            {won ? "Correct!" : "Game Over"}
          </ThemedText>

          {!won ? (
            <ThemedText
              type="body"
              style={[styles.targetReveal, { color: theme.textSecondary }]}
            >
              The number was {targetNumber}
            </ThemedText>
          ) : null}

          <View style={styles.resultStats}>
            <View style={styles.resultStatItem}>
              <ThemedText type="h4">{attemptsUsed}/{maxAttempts}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Attempts
              </ThemedText>
            </View>
            <View style={styles.resultStatItem}>
              <ThemedText type="h4">{timeUsed}s</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Time
              </ThemedText>
            </View>
            <View style={styles.resultStatItem}>
              <ThemedText type="h4">
                {Math.round((1 - attemptsUsed / maxAttempts) * 100)}%
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Efficiency
              </ThemedText>
            </View>
          </View>

          <View style={styles.resultButtons}>
            <Button onPress={onContinue} style={styles.continueButton}>
              {won ? "Next Level" : "Try Again"}
            </Button>
            <Pressable
              onPress={onStats}
              style={({ pressed }) => [
                styles.viewStatsLink,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <ThemedText type="link">View Stats</ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function GuessHistoryItem({ result }: { result: GuessResult }) {
  const { theme } = useTheme();
  const isCorrect = result.feedback === "correct";

  return (
    <Animated.View
      entering={FadeInUp.duration(200)}
      style={[
        styles.guessItem,
        {
          backgroundColor: isCorrect
            ? SemanticColors.success + "20"
            : theme.backgroundSecondary,
        },
      ]}
    >
      <ThemedText type="body" style={{ fontFamily: Fonts?.mono }}>
        {result.guess}
      </ThemedText>
      <View style={styles.guessFeedback}>
        {isCorrect ? (
          <Feather name="check" size={16} color={SemanticColors.success} />
        ) : (
          <>
            <Feather
              name={result.feedback === "higher" ? "arrow-up" : "arrow-down"}
              size={16}
              color={
                result.feedback === "higher"
                  ? GameModeColors.tactical
                  : GameModeColors.classic
              }
            />
            {result.hint ? (
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}
              >
                {result.hint}
              </ThemedText>
            ) : null}
          </>
        )}
      </View>
    </Animated.View>
  );
}

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const {
    gameState,
    currentLevelNumber,
    makeGuess,
    pauseGame,
    resumeGame,
    restartLevel,
    goToMainMenu,
    continueGame,
  } = useGame();

  const [inputValue, setInputValue] = useState("");
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [lastResult, setLastResult] = useState<{
    won: boolean;
    attemptsUsed: number;
    maxAttempts: number;
    timeUsed: number;
    targetNumber: number;
  } | null>(null);

  const inputScale = useSharedValue(1);

  const level = gameState.currentLevel;
  const modeColor = level ? GameModeColors[level.gameMode] : GameModeColors.classic;
  const modeIcon = level ? getModeIcon(level.gameMode) : "zap";
  const attemptsLeft = level
    ? level.maxAttempts - gameState.currentGuesses.length
    : 0;
  const timeRemaining = level?.timeLimit
    ? Math.max(0, level.timeLimit - gameState.elapsedTime)
    : null;

  useFocusEffect(
    useCallback(() => {
      // If we're not playing and have a level, check for win/loss
      if (!gameState.isPlaying && gameState.currentLevel && !showCompleteModal) {
        // If we have guesses, check the last one for victory
        // Note: The game-context might have already cleared currentGuesses if it moved to next level
        // but we want to show the result of the level just completed.
        // We use the results stored during handleSubmit if available.
        if (lastResult) {
          setShowCompleteModal(true);
        } else {
          // Fallback logic if lastResult is null
          const won = gameState.currentGuesses.some((g) => g.feedback === "correct");
          setLastResult({
            won,
            attemptsUsed: gameState.currentGuesses.length,
            maxAttempts: gameState.currentLevel.maxAttempts,
            timeUsed: gameState.elapsedTime,
            targetNumber: gameState.currentLevel.targetNumber,
          });
          setShowCompleteModal(true);
        }
      }
    }, [gameState.isPlaying, gameState.currentLevel, showCompleteModal, lastResult])
  );

  useEffect(() => {
    if (timeRemaining === 0 && gameState.isPlaying) {
      const won = gameState.currentGuesses.some((g) => g.feedback === "correct");
      if (!won && level) {
        setLastResult({
          won: false,
          attemptsUsed: gameState.currentGuesses.length,
          maxAttempts: level.maxAttempts,
          timeUsed: gameState.elapsedTime,
          targetNumber: level.targetNumber,
        });
        setShowCompleteModal(true);
      }
    }
  }, [timeRemaining, gameState.isPlaying]);

  const handleNumberPress = (num: string) => {
    if (inputValue.length < 4) {
      setInputValue((prev) => prev + num);
      inputScale.value = withSequence(
        withSpring(1.05, { damping: 15 }),
        withSpring(1, { damping: 15 })
      );
    }
  };

  const handleDelete = () => {
    setInputValue((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!inputValue || !level) return;
    const guess = parseInt(inputValue, 10);
    if (isNaN(guess) || guess < level.rangeMin || guess > level.rangeMax) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const alreadyGuessed = gameState.currentGuesses.some(g => g.guess === guess);
    if (alreadyGuessed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const result = makeGuess(guess);
    setInputValue("");

    if (result.feedback === "correct") {
      setLastResult({
        won: true,
        attemptsUsed: gameState.currentGuesses.length + 1,
        maxAttempts: level.maxAttempts,
        timeUsed: gameState.elapsedTime,
        targetNumber: level.targetNumber,
      });
      // Small delay to let the user see the correct guess in the history
      setTimeout(() => setShowCompleteModal(true), 600);
    } else if (gameState.currentGuesses.length + 1 >= level.maxAttempts) {
      setLastResult({
        won: false,
        attemptsUsed: gameState.currentGuesses.length + 1,
        maxAttempts: level.maxAttempts,
        timeUsed: gameState.elapsedTime,
        targetNumber: level.targetNumber,
      });
      // Small delay to let the user see the last guess in the history
      setTimeout(() => setShowCompleteModal(true), 600);
    }
  };

  const handlePause = () => {
    pauseGame();
    setShowPauseModal(true);
  };

  const handleResume = () => {
    setShowPauseModal(false);
    resumeGame();
  };

  const handleRestart = () => {
    setShowPauseModal(false);
    setShowCompleteModal(false);
    restartLevel();
    setInputValue("");
  };

  const handleMainMenu = () => {
    setShowPauseModal(false);
    setShowCompleteModal(false);
    goToMainMenu();
    navigation.navigate("MainMenu");
  };

  const handleContinue = () => {
    setShowCompleteModal(false);
    setInputValue("");
    if (lastResult?.won) {
      continueGame();
    } else {
      // Don't auto-restart, just stay on the screen or handle as needed
      // If we want them to be able to try again, we can call restartLevel()
      // but the user says it restarts instead of showing lose screen.
      // The modal IS the lose screen, so handleContinue is only called when they press a button.
      restartLevel();
    }
  };

  const handleViewStats = () => {
    setShowPauseModal(false);
    navigation.navigate("Stats");
  };

  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  if (!level) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const modeNames: Record<GameMode, string> = {
    classic: "Classic",
    depth: "Depth",
    strategic: "Strategic",
    tactical: "Tactical",
    deus: "Deus",
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md },
        ]}
      >
        <Pressable
          onPress={handlePause}
          style={({ pressed }) => [
            styles.headerButton,
            { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="pause" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.levelInfo}>
          <ThemedText type="h4">Level {currentLevelNumber}</ThemedText>
          <View style={[styles.modeBadge, { backgroundColor: modeColor + "20" }]}>
            <Feather name={modeIcon as any} size={14} color={modeColor} />
            <ThemedText type="small" style={{ color: modeColor, marginLeft: 4 }}>
              {modeNames[level.gameMode]}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {attemptsLeft}
          </ThemedText>
        </View>
      </View>

      <View style={styles.gameArea}>
        <Card elevation={1} style={styles.rangeCard}>
          <View style={styles.rangeRow}>
            <View style={styles.rangeItem}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Range
              </ThemedText>
              <ThemedText type="h4">
                {level.rangeMin} - {level.rangeMax}
              </ThemedText>
            </View>
            <View style={styles.rangeDivider} />
            <View style={styles.rangeItem}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Attempts
              </ThemedText>
              <ThemedText type="h4">
                {gameState.currentGuesses.length}/{level.maxAttempts}
              </ThemedText>
            </View>
            {timeRemaining !== null ? (
              <>
                <View style={styles.rangeDivider} />
                <View style={styles.rangeItem}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Time
                  </ThemedText>
                  <ThemedText
                    type="h4"
                    style={{
                      color:
                        timeRemaining <= 10
                          ? SemanticColors.error
                          : theme.text,
                    }}
                  >
                    {timeRemaining}s
                  </ThemedText>
                </View>
              </>
            ) : null}
          </View>
        </Card>

        <Animated.View style={[styles.inputDisplay, inputStyle]}>
          <ThemedText
            style={[
              styles.inputText,
              { color: inputValue ? theme.text : theme.textDisabled },
            ]}
          >
            {inputValue || "?"}
          </ThemedText>
        </Animated.View>

        <View style={styles.guessHistory}>
          {gameState.currentGuesses.slice(-4).map((result, index) => (
            <GuessHistoryItem key={`${result.guess}-${index}`} result={result} />
          ))}
        </View>
      </View>

      <View style={[styles.numpadContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <NumberPad
          onPress={handleNumberPress}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          disabled={!gameState.isPlaying || gameState.isPaused}
        />
      </View>

      <PauseModal
        visible={showPauseModal}
        onResume={handleResume}
        onRestart={handleRestart}
        onStats={handleViewStats}
        onMainMenu={handleMainMenu}
      />

      <LevelCompleteModal
        visible={showCompleteModal}
        won={lastResult?.won ?? false}
        attemptsUsed={lastResult?.attemptsUsed ?? 0}
        maxAttempts={lastResult?.maxAttempts ?? 1}
        timeUsed={lastResult?.timeUsed ?? 0}
        targetNumber={lastResult?.targetNumber ?? 0}
        onContinue={handleContinue}
        onStats={handleViewStats}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  levelInfo: {
    alignItems: "center",
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  rangeCard: {
    marginBottom: Spacing["2xl"],
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  rangeItem: {
    alignItems: "center",
    flex: 1,
  },
  rangeDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#2D3748",
  },
  inputDisplay: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  inputText: {
    fontSize: 72,
    fontWeight: "700",
    fontFamily: Fonts?.mono,
    letterSpacing: 4,
  },
  guessHistory: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    minHeight: 80,
  },
  guessItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  guessFeedback: {
    flexDirection: "row",
    alignItems: "center",
  },
  numpadContainer: {
    paddingHorizontal: Spacing.xl,
  },
  numpad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  numpadKey: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  pauseModal: {
    width: "100%",
    maxWidth: 320,
    padding: Spacing["2xl"],
    borderRadius: BorderRadius["2xl"],
    alignItems: "center",
  },
  pauseTitle: {
    marginBottom: Spacing.xl,
  },
  pauseButtons: {
    width: "100%",
    gap: Spacing.md,
  },
  pauseButton: {
    width: "100%",
  },
  completeModal: {
    width: "100%",
    maxWidth: 320,
    padding: Spacing["2xl"],
    borderRadius: BorderRadius["2xl"],
    alignItems: "center",
  },
  resultIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  resultTitle: {
    marginBottom: Spacing.sm,
  },
  targetReveal: {
    marginBottom: Spacing.xl,
  },
  resultStats: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
    gap: Spacing["2xl"],
  },
  resultStatItem: {
    alignItems: "center",
  },
  resultButtons: {
    width: "100%",
    alignItems: "center",
    gap: Spacing.md,
  },
  continueButton: {
    width: "100%",
  },
  viewStatsLink: {
    padding: Spacing.sm,
  },
});
