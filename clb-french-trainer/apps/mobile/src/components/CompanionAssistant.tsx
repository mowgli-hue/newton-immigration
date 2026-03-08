import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCompanion } from '../context/CompanionContext';
import { askAITutor } from '../services/ai/AITutorChatService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const routeHints: Record<string, string> = {
  WelcomeScreen: 'Pick the companion style that fits how you learn best before continuing.',
  SelfAssessmentScreen: 'Choose the level that feels true today. Accuracy helps personalize your path.',
  BeginnerFoundationScreen: 'Foundation builds confidence fast. Short daily practice is better than long sessions.',
  A1FoundationScreen: 'Complete lessons in order. Passing each one unlocks the next.',
  FoundationLessonScreen: 'Read the explanation first, then answer slowly. Use feedback to improve right away.',
  A1Lesson1Screen: 'Use the audio cues often. Repeat out loud to train sound memory.',
  DiagnosticFlowScreen: 'Focus on one question at a time. Correct answers move difficulty up gradually.',
  DiagnosticResultScreen: 'Review your result level and continue with the next recommended module.'
};

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

function buildTutorReply(question: string, routeName: string, companionName: string, hintText: string) {
  const q = question.toLowerCase();
  if (q.includes('pronunciation') || q.includes('speak') || q.includes('audio')) {
    return `${companionName}: Speak slowly and repeat the model 3 times. Focus on clarity before speed. ${hintText}`;
  }
  if (q.includes('grammar') || q.includes('verb') || q.includes('article')) {
    return `${companionName}: Start with one pattern only. Copy one model sentence, then change one word. That is the fastest way to learn grammar.`;
  }
  if (q.includes('writing') || q.includes('email') || q.includes('sentence')) {
    return `${companionName}: Write short sentences first. Check task words, then add one detail. Accuracy matters more than length at this stage.`;
  }
  if (q.includes('listening') || q.includes('understand')) {
    return `${companionName}: Do listening in 3 steps: hear once for idea, hear again for key words, then repeat the line aloud.`;
  }
  if (q.includes('what') || q.includes('next') || q.includes('now')) {
    return `${companionName}: On this screen, do the current task slowly, check feedback, then continue. ${hintText}`;
  }
  return `${companionName}: Good question. Focus on one small improvement right now, then repeat once. ${hintText}`;
}

export function CompanionAssistant() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { selectedCompanion } = useCompanion();
  const drag = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragStart = useRef({ x: 0, y: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const routeName = useNavigationState((state) => {
    const route = state?.routes?.[state?.index ?? 0];
    return route?.name ?? 'WelcomeScreen';
  });

  const hintText = useMemo(() => {
    return routeHints[routeName] ?? 'Keep going. Small consistent steps make French progress sustainable.';
  }, [routeName]);
  const isLessonRoute = useMemo(
    () =>
      routeName === 'FoundationLessonScreen' ||
      routeName === 'A1ModuleLessonScreen' ||
      routeName === 'A2ModuleLessonScreen' ||
      routeName === 'B1ModuleLessonScreen' ||
      routeName === 'CLBModuleLessonScreen' ||
      routeName === 'A1Lesson1Screen' ||
      routeName === 'A1Lesson3Screen',
    [routeName]
  );

  useEffect(() => {
    if (isLessonRoute && open) {
      setOpen(false);
    }
  }, [isLessonRoute, open]);

  const submitQuestion = async (rawQuestion?: string) => {
    const question = (rawQuestion ?? input).trim();
    if (!question) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question
    };
    setMessages((prev) => [...prev.slice(-7), userMsg]);
    setIsSending(true);
    try {
      const result = await askAITutor({
        question,
        routeName,
        companionName: selectedCompanion.name,
        hintText,
        recentMessages: messages.slice(-6).map((m) => ({ role: m.role, text: m.text }))
      });
      const reply: ChatMessage = {
        id: `a-${Date.now()}-1`,
        role: 'assistant',
        text: result.reply
      };
      setMessages((prev) => [...prev.slice(-8), reply]);
    } catch {
      const fallback: ChatMessage = {
        id: `a-${Date.now()}-fallback`,
        role: 'assistant',
        text: buildTutorReply(question, routeName, selectedCompanion.name, hintText)
      };
      setMessages((prev) => [...prev.slice(-8), fallback]);
    } finally {
      setIsSending(false);
    }
    setInput('');
  };
  const sendQuestion = () => {
    void submitQuestion();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !open,
      onMoveShouldSetPanResponder: (_, gesture) => !open && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
      onPanResponderGrant: () => {
        if (open) return;
        drag.stopAnimation((value: { x: number; y: number }) => {
          dragStart.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        if (open) return;
        drag.setValue({
          x: dragStart.current.x + gesture.dx,
          y: dragStart.current.y + gesture.dy
        });
      },
      onPanResponderRelease: (_, gesture) => {
        if (open) return;
        const wasTap = Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6;
        if (wasTap) {
          setOpen((prev) => !prev);
        }
      }
    })
  ).current;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.container,
          { bottom: isLessonRoute ? Math.max(10, insets.bottom + 6) : Math.max(20, insets.bottom + 12) },
          { right: isLessonRoute ? 10 : spacing.lg },
          { transform: [{ translateX: drag.x }, { translateY: drag.y }] }
        ]}
      >
        {open ? (
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{selectedCompanion.emoji} AI Tutor</Text>
              <Text style={styles.panelMeta}>Ask a question to get guidance.</Text>
            </View>
            <ScrollView style={styles.chatList} contentContainerStyle={styles.chatListContent} showsVerticalScrollIndicator={false}>
              {messages.filter((message) => message.role === 'assistant').map((message) => (
                <View
                  key={message.id}
                  style={[styles.chatBubble, styles.chatBubbleAssistant]}
                >
                  <Text style={styles.chatText}>{message.text}</Text>
                </View>
              ))}
              {messages.length === 0 ? <Text style={styles.emptyText}>No response yet. Ask your first question.</Text> : null}
            </ScrollView>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask AI Tutor..."
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                onSubmitEditing={sendQuestion}
                returnKeyType="send"
              />
              <Pressable style={styles.sendButton} onPress={sendQuestion}>
                <Text style={styles.sendButtonText}>{isSending ? '...' : 'Send'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Animated.View {...panResponder.panHandlers}>
          <Pressable style={[styles.fab, isLessonRoute && styles.fabCompact]} onPress={() => setOpen((prev) => !prev)}>
            <Text style={styles.fabEmoji}>{selectedCompanion.emoji}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.lg,
    alignItems: 'flex-end',
    maxWidth: 320,
    gap: spacing.sm
  },
  panel: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    width: 320,
    maxHeight: 420
  },
  panelTitle: {
    ...typography.bodyStrong,
    color: colors.secondary,
    fontWeight: '700'
  },
  panelMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  panelHeader: {
    marginBottom: spacing.sm
  },
  chatList: {
    maxHeight: 180
  },
  chatListContent: {
    gap: spacing.xs,
    paddingBottom: spacing.xs
  },
  chatBubble: {
    borderRadius: 12,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm
  },
  chatBubbleAssistant: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start'
  },
  chatBubbleUser: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end'
  },
  chatText: {
    ...typography.caption,
    color: colors.textPrimary
  },
  chatTextUser: {
    color: colors.white
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    color: colors.textPrimary
  },
  sendButton: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8
  },
  sendButtonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700'
  },
  fab: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4
  },
  fabEmoji: {
    fontSize: 18
  },
  fabCompact: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 20
  }
});
