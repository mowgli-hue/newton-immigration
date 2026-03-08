import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './context/AuthContext';
import { CompanionProvider } from './context/CompanionContext';
import { CurriculumProgressProvider } from './context/CurriculumProgressContext';
import { FocusSessionProvider } from './context/FocusSessionContext';
import { FoundationProgressProvider } from './context/FoundationProgressContext';
import { LearningTelemetryProvider } from './context/LearningTelemetryContext';
import { LessonNotesProvider } from './context/LessonNotesContext';
import { LearningProgressProvider } from './context/LearningProgressContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { AppNavigator } from './navigation/AppNavigator';

type AppErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unknown runtime error';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    // Keep logs visible for browser console and Netlify debugging.
    console.error('[app] Runtime crash', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorRoot}>
          <Text style={styles.errorTitle}>App failed to load</Text>
          <Text style={styles.errorBody}>
            {this.state.message ?? 'Unknown runtime error. Please check environment variables and redeploy.'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <CompanionProvider>
            <FocusSessionProvider>
              <SubscriptionProvider>
                <CurriculumProgressProvider>
                  <LearningTelemetryProvider>
                    <LessonNotesProvider>
                      <LearningProgressProvider>
                        <FoundationProgressProvider>
                          <NavigationContainer>
                            <StatusBar style="dark" />
                            <AppNavigator />
                          </NavigationContainer>
                        </FoundationProgressProvider>
                      </LearningProgressProvider>
                    </LessonNotesProvider>
                  </LearningTelemetryProvider>
                </CurriculumProgressProvider>
              </SubscriptionProvider>
            </FocusSessionProvider>
          </CompanionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'center'
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12
  },
  errorBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155'
  }
});
