import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useLearningTelemetry } from '../context/LearningTelemetryContext';
import { getReflexLevel, reflexRunLevels, type ReflexRunItem } from '../data/frenchReflexRunData';
import type { MainStackParamList } from '../navigation/AppNavigator';
import { updateReflexPerformanceProfile } from '../services/progress/reflexProfileRepository';
import { playPronunciation } from '../services/audio/pronunciationAudio';
import type { ReflexSessionMetrics, ReflexWeakArea } from '../types/ReflexPerformanceTypes';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'FrenchReflexRunScreen'>;

type GameStatus = 'menu' | 'playing' | 'summary';

type Round = {
  id: string;
  targetPrompt: string;
  answer: string;
  options: [string, string, string];
  correctLane: 0 | 1 | 2;
  weakArea: ReflexWeakArea;
  startedAt: number;
};

const PANEL_HEIGHT = 68;
const HORIZONTAL_PADDING = 22;
const SWIPE_THRESHOLD = 20;
const MAX_ROUNDS_PER_SESSION = 26;

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle3(items: [string, string, string]): [string, string, string] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next as [string, string, string];
}

function buildRound(levelId: 1 | 2 | 3 | 4 | 5): Round {
  const level = getReflexLevel(levelId);
  const item = randomItem(level.items);
  const options = shuffle3([item.answer, item.distractors[0], item.distractors[1]]);
  const correctLane = Math.max(0, options.findIndex((option) => option === item.answer)) as 0 | 1 | 2;
  return {
    id: `reflex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    targetPrompt: item.targetPrompt,
    answer: item.answer,
    options,
    correctLane,
    weakArea: item.weakArea,
    startedAt: Date.now()
  };
}

function buildTip(metrics: ReflexSessionMetrics): string {
  if (metrics.accuracyPercent < 65) {
    return 'Slow down lane switches and lock target words before swiping. Accuracy first.';
  }
  if (metrics.averageReactionMs > 1800) {
    return 'Good control. Next step: react earlier by reading all 3 lanes at spawn.';
  }
  const topWeak = Object.entries(metrics.weakAreaCounts).sort((a, b) => Number(b[1] ?? 0) - Number(a[1] ?? 0))[0]?.[0];
  if (topWeak === 'gender') return 'Focus on article + noun chunks (le/la/un/une) to improve reflex precision.';
  if (topWeak === 'verbs') return 'Review present-tense verb forms (je suis, nous sommes, ils sont) for faster responses.';
  return 'Strong run. Increase difficulty and keep consistency for CLB-ready reflex speed.';
}

function getWarmupSpeedMultiplier(levelId: 1 | 2 | 3 | 4 | 5, roundCount: number): number {
  if (roundCount >= 4) return 1;
  if (levelId === 1) return 0.74 + roundCount * 0.08;
  if (levelId === 2) return 0.8 + roundCount * 0.06;
  if (levelId === 3) return 0.86 + roundCount * 0.05;
  if (levelId === 4) return 0.9 + roundCount * 0.04;
  return 0.94 + roundCount * 0.03;
}

export function FrenchReflexRunScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { trackEvent } = useLearningTelemetry();

  const [status, setStatus] = useState<GameStatus>('menu');
  const [levelId, setLevelId] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [lane, setLane] = useState<0 | 1 | 2>(1);
  const [round, setRound] = useState<Round | null>(null);
  const [score, setScore] = useState({ streak: 0, longestStreak: 0, correct: 0, total: 0 });
  const [speed, setSpeed] = useState(getReflexLevel(1).startSpeed);
  const [roundCount, setRoundCount] = useState(0);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [weakAreaCounts, setWeakAreaCounts] = useState<Partial<Record<ReflexWeakArea, number>>>({});
  const [reactionMs, setReactionMs] = useState<number[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState<ReflexSessionMetrics | null>(null);

  const runnerX = useRef(new Animated.Value(0)).current;
  const obstacleY = useRef(new Animated.Value(-PANEL_HEIGHT)).current;
  const runBob = useRef(new Animated.Value(0)).current;
  const screenShake = useRef(new Animated.Value(0)).current;
  const runnerGlow = useRef(new Animated.Value(0.2)).current;
  const panelPulse = useRef(new Animated.Value(1)).current;
  const successBurst = useRef(new Animated.Value(0)).current;
  const streakDrift = useRef(new Animated.Value(0)).current;
  const roundRef = useRef<Round | null>(null);
  const laneRef = useRef<0 | 1 | 2>(1);
  const laneWidthRef = useRef((Dimensions.get('window').width - HORIZONTAL_PADDING * 2) / 3);
  const hitLineYRef = useRef(420);
  const fallingAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(runBob, { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.timing(runBob, { toValue: 0, duration: 340, useNativeDriver: true })
      ])
    );
    bob.start();
    return () => bob.stop();
  }, [runBob]);

  useEffect(() => {
    const streakLoop = Animated.loop(
      Animated.timing(streakDrift, {
        toValue: 1,
        duration: 1700,
        useNativeDriver: true
      })
    );
    streakLoop.start();
    return () => streakLoop.stop();
  }, [streakDrift]);

  const triggerOverlay = (message: string, duration = 650) => {
    setOverlay(message);
    setTimeout(() => setOverlay(null), duration);
  };

  const animateRunnerToLane = (nextLane: 0 | 1 | 2) => {
    const laneWidth = laneWidthRef.current;
    const targetX = (nextLane - 1) * laneWidth;
    Animated.spring(runnerX, {
      toValue: targetX,
      useNativeDriver: true,
      stiffness: 220,
      damping: 20
    }).start();
  };

  const moveToLane = (nextLane: 0 | 1 | 2) => {
    if (nextLane === laneRef.current) return;
    setLane(nextLane);
    animateRunnerToLane(nextLane);
  };

  const shakeOnMiss = () => {
    Animated.sequence([
      Animated.timing(screenShake, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(screenShake, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(screenShake, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const glowMilestone = () => {
    Animated.sequence([
      Animated.timing(runnerGlow, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(runnerGlow, { toValue: 0.25, duration: 260, useNativeDriver: true })
    ]).start();
  };

  const pulsePanels = () => {
    Animated.sequence([
      Animated.timing(panelPulse, { toValue: 1.05, duration: 110, useNativeDriver: true }),
      Animated.timing(panelPulse, { toValue: 1, duration: 140, useNativeDriver: true })
    ]).start();
  };

  const triggerSuccessBurst = () => {
    successBurst.setValue(0);
    Animated.timing(successBurst, {
      toValue: 1,
      duration: 340,
      useNativeDriver: true
    }).start();
  };

  const stopFalling = () => {
    fallingAnimRef.current?.stop?.();
    fallingAnimRef.current = null;
  };

  const finalizeSession = async () => {
    stopFalling();
    const accuracy = score.total ? Math.round((score.correct / score.total) * 100) : 0;
    const avgReaction = reactionMs.length ? Math.round(reactionMs.reduce((a, b) => a + b, 0) / reactionMs.length) : 0;
    const metrics: ReflexSessionMetrics = {
      accuracyPercent: accuracy,
      averageReactionMs: avgReaction,
      longestStreak: score.longestStreak,
      weakAreaCounts
    };
    setSessionMetrics(metrics);
    setStatus('summary');

    trackEvent({
      type: 'exercise_submitted',
      lessonId: 'practice-reflex-run',
      skill: 'integrated',
      scorePercent: accuracy,
      metadata: {
        mode: 'french_reflex_run',
        averageReactionMs: avgReaction,
        longestStreak: score.longestStreak,
        rounds: score.total
      }
    });

    if (user?.uid) {
      await updateReflexPerformanceProfile(user.uid, metrics);
    }
  };

  const spawnNextRound = () => {
    const level = getReflexLevel(levelId);
    const nextRound = buildRound(levelId);
    roundRef.current = nextRound;
    setRound(nextRound);
    obstacleY.setValue(-PANEL_HEIGHT);

    if (level.mode === 'audio') {
      void playPronunciation(nextRound.targetPrompt);
    }

    const warmupMultiplier = getWarmupSpeedMultiplier(levelId, roundCount);
    const effectiveSpeed = Math.max(level.minSpeed, speed * warmupMultiplier);
    const distancePx = hitLineYRef.current + PANEL_HEIGHT;
    const durationMs = Math.max(680, Math.round((distancePx / effectiveSpeed) * 1000));

    fallingAnimRef.current = Animated.timing(obstacleY, {
      toValue: hitLineYRef.current,
      duration: durationMs,
      useNativeDriver: true
    });
    fallingAnimRef.current.start(({ finished }) => {
      if (!finished) return;
      const currentRound = roundRef.current;
      if (!currentRound) return;
      const reaction = Date.now() - currentRound.startedAt;
      const correct = laneRef.current === currentRound.correctLane;

      setScore((prev) => {
        const nextStreak = correct ? prev.streak + 1 : Math.max(0, prev.streak - 1);
        const nextLongest = Math.max(prev.longestStreak, nextStreak);
        return {
          streak: nextStreak,
          longestStreak: nextLongest,
          correct: prev.correct + (correct ? 1 : 0),
          total: prev.total + 1
        };
      });

      setRoundCount((prev) => prev + 1);
      setReactionMs((prev) => [...prev, reaction].slice(-120));

      if (correct) {
        setSpeed((prev) => Math.min(level.maxSpeed, prev + level.speedStep));
        triggerOverlay('Correct');
        pulsePanels();
        triggerSuccessBurst();
        if ((score.streak + 1) % 10 === 0) {
          glowMilestone();
          triggerOverlay(`Streak ${score.streak + 1}`);
        }
      } else {
        setSpeed((prev) => Math.max(level.minSpeed, prev - Math.max(4, level.speedStep - 3)));
        shakeOnMiss();
        setWeakAreaCounts((prev) => ({
          ...prev,
          [currentRound.weakArea]: (prev[currentRound.weakArea] ?? 0) + 1
        }));
        triggerOverlay(`Correction: ${currentRound.answer}`, 850);
      }

      if (roundCount + 1 >= MAX_ROUNDS_PER_SESSION) {
        void finalizeSession();
      } else {
        setTimeout(spawnNextRound, 120);
      }
    });
  };

  const startGame = () => {
    setStatus('playing');
    setLane(1);
    laneRef.current = 1;
    runnerX.setValue(0);
    setScore({ streak: 0, longestStreak: 0, correct: 0, total: 0 });
    setRoundCount(0);
    setWeakAreaCounts({});
    setReactionMs([]);
    setSessionMetrics(null);
    setSpeed(getReflexLevel(levelId).startSpeed);
    triggerOverlay('Go', 450);
    setTimeout(spawnNextRound, 180);
  };

  const handleLeave = () => {
    if (status === 'playing') {
      void finalizeSession();
      return;
    }
    navigation.goBack();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dx) > 12,
        onPanResponderRelease: (_evt, gestureState) => {
          if (status !== 'playing') return;
          if (gestureState.dx <= -SWIPE_THRESHOLD) {
            const next = Math.max(0, laneRef.current - 1) as 0 | 1 | 2;
            moveToLane(next);
          } else if (gestureState.dx >= SWIPE_THRESHOLD) {
            const next = Math.min(2, laneRef.current + 1) as 0 | 1 | 2;
            moveToLane(next);
          }
        }
      }),
    [status]
  );

  useEffect(
    () => () => {
      stopFalling();
    },
    []
  );

  const accuracy = score.total ? Math.round((score.correct / score.total) * 100) : 0;
  const avgReaction = reactionMs.length ? Math.round(reactionMs.reduce((a, b) => a + b, 0) / reactionMs.length) : 0;
  const speedLevel = Math.max(1, Math.round((speed - getReflexLevel(levelId).minSpeed) / 20));

  const laneCenters = useMemo(() => {
    const w = laneWidthRef.current;
    return [0, w, w * 2];
  }, [laneWidthRef.current]);

  if (status === 'menu') {
    return (
      <LinearGradient colors={['#070B18', '#0A1226', '#111A33']} style={styles.root}>
        <Card>
          <Text style={styles.menuTitle}>French Reflex Run</Text>
          <Text style={styles.menuSubtitle}>
            Swipe lanes fast. Lock the correct French answer before collision.
          </Text>
          <View style={styles.levelGrid}>
            {reflexRunLevels.map((level) => {
              const selected = level.id === levelId;
              return (
                <Pressable
                  key={level.id}
                  style={[styles.levelCard, selected && styles.levelCardActive]}
                  onPress={() => setLevelId(level.id)}
                >
                  <Text style={[styles.levelLabel, selected && styles.levelLabelActive]}>{level.label}</Text>
                  <Text style={styles.levelMeta}>{level.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.menuActions}>
            <Button label="Start Reflex Run" onPress={startGame} />
            <Button label="Back to Practice" variant="outline" onPress={() => navigation.goBack()} />
          </View>
        </Card>
      </LinearGradient>
    );
  }

  if (status === 'summary' && sessionMetrics) {
    const tip = buildTip(sessionMetrics);
    return (
      <LinearGradient colors={['#070B18', '#0A1226', '#111A33']} style={styles.root}>
        <Card>
          <Text style={styles.menuTitle}>Reflex Training Complete</Text>
          <Text style={styles.summaryLine}>Accuracy: {sessionMetrics.accuracyPercent}%</Text>
          <Text style={styles.summaryLine}>Longest Streak: {sessionMetrics.longestStreak}</Text>
          <Text style={styles.summaryLine}>Average Reaction: {sessionMetrics.averageReactionMs} ms</Text>
          <Text style={styles.summaryTip}>Tip: {tip}</Text>
          <View style={styles.menuActions}>
            <Button label="Run Again" onPress={startGame} />
            <Button label="Back to Practice" variant="outline" onPress={() => navigation.goBack()} />
          </View>
        </Card>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#060A16', '#0D1730', '#18294A']} style={styles.root}>
      <Animated.View style={[styles.gameWrap, { transform: [{ translateX: screenShake }] }]} {...panResponder.panHandlers}>
        <View style={styles.topBar}>
          <Pressable onPress={handleLeave} style={styles.exitBtn}>
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLine}>Streak {score.streak}</Text>
            <Text style={styles.scoreLine}>Accuracy {accuracy}%</Text>
            <Text style={styles.scoreLine}>Speed L{speedLevel}</Text>
          </View>
        </View>

        <View
          style={styles.laneArea}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            laneWidthRef.current = width / 3;
            hitLineYRef.current = event.nativeEvent.layout.height - 134;
          }}
        >
          <Text style={styles.targetLabel}>Target</Text>
          {round ? (
            <>
              {getReflexLevel(levelId).mode === 'audio' ? (
                <Pressable style={styles.audioTargetBtn} onPress={() => void playPronunciation(round.targetPrompt)}>
                  <Text style={styles.audioTargetText}>Play Audio Target</Text>
                </Pressable>
              ) : (
                <Text style={styles.targetPrompt}>{round.targetPrompt}</Text>
              )}
            </>
          ) : null}

          <View style={styles.laneGuides}>
            <View style={styles.laneGuide} />
            <View style={styles.laneGuide} />
            <View style={styles.laneGuide} />
          </View>

          {status === 'playing' ? (
            <View style={styles.tapLanesOverlay} pointerEvents="box-none">
              <Pressable style={styles.tapLane} onPress={() => moveToLane(0)} />
              <Pressable style={styles.tapLane} onPress={() => moveToLane(1)} />
              <Pressable style={styles.tapLane} onPress={() => moveToLane(2)} />
            </View>
          ) : null}
          {[0, 1, 2, 3, 4].map((i) => {
            const opacityBase = 0.12 + i * 0.03;
            return (
              <Animated.View
                key={`streak-${i}`}
                style={[
                  styles.speedStreak,
                  {
                    left: `${10 + i * 18}%`,
                    opacity: opacityBase,
                    transform: [
                      {
                        translateY: streakDrift.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-90 - i * 22, hitLineYRef.current + 190 + i * 24]
                        })
                      }
                    ]
                  }
                ]}
              />
            );
          })}

          {round ? (
            <Animated.View style={[styles.panelsRow, { transform: [{ translateY: obstacleY }, { scale: panelPulse }] }]}>
              {round.options.map((option, idx) => (
                <View key={`${round.id}-${option}-${idx}`} style={styles.wordPanel}>
                  <Text style={styles.wordPanelText}>{option}</Text>
                </View>
              ))}
            </Animated.View>
          ) : null}

          <View style={[styles.hitLine, { top: hitLineYRef.current + 26 }]} />

          <Animated.View
            style={[
              styles.runnerWrap,
              {
                top: hitLineYRef.current,
                transform: [
                  { translateX: runnerX },
                  {
                    translateY: runBob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] })
                  }
                ]
              }
            ]}
          >
            <Animated.View style={[styles.runnerGlow, { opacity: runnerGlow }]} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Animated.View
                key={`burst-${i}`}
                style={[
                  styles.successParticle,
                  {
                    transform: [
                      {
                        translateX: successBurst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, (i % 2 === 0 ? -1 : 1) * (12 + i * 4)]
                        })
                      },
                      {
                        translateY: successBurst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -8 - i * 5]
                        })
                      },
                      {
                        scale: successBurst.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.25]
                        })
                      }
                    ],
                    opacity: successBurst.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0, 0.9, 0]
                    })
                  }
                ]}
              />
            ))}
            <View style={styles.runnerHead} />
            <View style={styles.runnerBody} />
            <View style={styles.runnerLegs} />
          </Animated.View>
        </View>

        {overlay ? (
          <View style={styles.overlayWrap}>
            <Text style={styles.overlayText}>{overlay}</Text>
          </View>
        ) : null}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  gameWrap: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  exitBtn: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111827'
  },
  exitText: {
    ...typography.caption,
    color: '#E2E8F0'
  },
  scoreBox: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0B1224',
    minWidth: 136
  },
  scoreLine: {
    ...typography.caption,
    color: '#D1D5DB',
    textAlign: 'right'
  },
  laneArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#23324C',
    borderRadius: 18,
    backgroundColor: 'rgba(8, 14, 28, 0.88)',
    overflow: 'hidden'
  },
  targetLabel: {
    ...typography.caption,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: spacing.md
  },
  targetPrompt: {
    ...typography.title,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: spacing.xs
  },
  audioTargetBtn: {
    alignSelf: 'center',
    marginTop: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  audioTargetText: {
    ...typography.caption,
    color: '#DBEAFE',
    fontWeight: '700'
  },
  laneGuides: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row'
  },
  laneGuide: {
    flex: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148,163,184,0.14)'
  },
  tapLanesOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 2
  },
  tapLane: {
    flex: 1
  },
  speedStreak: {
    position: 'absolute',
    width: 2,
    height: 70,
    borderRadius: 2,
    backgroundColor: '#38BDF8'
  },
  panelsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row'
  },
  wordPanel: {
    flex: 1,
    marginHorizontal: 6,
    height: PANEL_HEIGHT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: 'rgba(30,58,138,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 2
  },
  wordPanelText: {
    ...typography.bodyStrong,
    color: '#E0E7FF'
  },
  hitLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: '#38BDF8',
    opacity: 0.55
  },
  runnerWrap: {
    position: 'absolute',
    left: '33.33%',
    marginLeft: -24,
    width: 48,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center'
  },
  runnerGlow: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#22D3EE'
  },
  successParticle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7DD3FC'
  },
  runnerHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C7D2FE',
    marginBottom: 2
  },
  runnerBody: {
    width: 6,
    height: 20,
    borderRadius: 3,
    backgroundColor: '#E2E8F0'
  },
  runnerLegs: {
    marginTop: 2,
    width: 18,
    height: 12,
    borderBottomWidth: 3,
    borderBottomColor: '#E2E8F0',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    borderRightWidth: 3,
    borderRightColor: 'transparent'
  },
  overlayWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 64,
    alignItems: 'center'
  },
  overlayText: {
    ...typography.bodyStrong,
    color: '#D1FAE5',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  menuTitle: {
    ...typography.heading2,
    color: colors.textPrimary
  },
  menuSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md
  },
  levelGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  levelCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  levelCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EEF4FF'
  },
  levelLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary
  },
  levelLabelActive: {
    color: colors.primary
  },
  levelMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  menuActions: {
    gap: spacing.sm
  },
  summaryLine: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs
  },
  summaryTip: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md
  }
});
