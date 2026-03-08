import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationState, NavigatorScreenParams, useNavigationState } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CompanionAssistant } from '../components/CompanionAssistant';
import { GlobalFocusTimerBar } from '../components/GlobalFocusTimerBar';
import { useAuth } from '../context/AuthContext';
import { A1FoundationScreen } from '../screens/A1FoundationScreen';
import { A1Lesson1Screen } from '../screens/A1Lesson1Screen';
import { A1ModuleLessonScreen } from '../screens/A1ModuleLessonScreen';
import { A2ModuleLessonScreen } from '../screens/A2ModuleLessonScreen';
import { AITeacherSessionScreen } from '../screens/AITeacherSessionScreen';
import { B1ModuleLessonScreen } from '../screens/B1ModuleLessonScreen';
import { CLBModuleLessonScreen } from '../screens/CLBModuleLessonScreen';
import { BeginnerFoundationScreen } from '../screens/BeginnerFoundationScreen';
import { DiagnosticFlowScreen } from '../screens/DiagnosticFlowScreen';
import { DiagnosticResultScreen } from '../screens/DiagnosticResultScreen';
import { ErrorHunterScreen } from '../screens/ErrorHunterScreen';
import { FrenchReflexRunScreen } from '../screens/FrenchReflexRunScreen';
import { FocusSessionScreen } from '../screens/FocusSessionScreen';
import { FoundationLessonScreen } from '../screens/FoundationLessonScreen';
import { HomeDashboardScreen } from '../screens/HomeDashboardScreen';
import { LevelUnlockScreen } from '../screens/LevelUnlockScreen';
import { LearningHubScreen } from '../screens/LearningHubScreen';
import { ModuleReviewScreen } from '../screens/ModuleReviewScreen';
import { PathMapScreen } from '../screens/PathMapScreen';
import { PathPreparationScreen } from '../screens/PathPreparationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { UpgradeScreen } from '../screens/UpgradeScreen';
import { ContactUsScreen } from '../screens/profile/ContactUsScreen';
import { ImmigrationServicesScreen } from '../screens/profile/ImmigrationServicesScreen';
import { PrivacyPolicyScreen } from '../screens/profile/PrivacyPolicyScreen';
import { SubscriptionScreen } from '../screens/profile/SubscriptionScreen';
import { PracticeHubScreen } from '../screens/PracticeHubScreen';
import { SelfAssessmentScreen } from '../screens/SelfAssessmentScreen';
import { SpeedRecallScreen } from '../screens/SpeedRecallScreen';
import { StudyPlanIntroScreen } from '../screens/StudyPlanIntroScreen';
import { TeacherScriptsScreen } from '../screens/TeacherScriptsScreen';
import { A1Lesson3Screen } from '../screens/A1Lesson3Screen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { loadCloudProfileState, saveCloudOnboardingCompleted } from '../services/cloud/userStateRepository';
import {
  loadLastMainRoute,
  loadUserOnboardingProfile,
  saveLastMainRoute,
  type OnboardingGoalType,
  type OnboardingSelfLevel,
  type PersistedMainRoute
} from './routePersistence';

export type AuthStackParamList = {
  LoginScreen:
    | {
        prefillEmail?: string;
        notice?: string;
      }
    | undefined;
  RegisterScreen: undefined;
};

type LessonCompletionSummaryParams = {
  completedLessonId: string;
  completedLessonScore: number;
  nextLessonId?: string;
  minorCorrection?: boolean;
};

export type OnboardingStackParamList = {
  WelcomeScreen: undefined;
  SelfAssessmentScreen: undefined;
  StudyPlanIntroScreen: { goalType: OnboardingGoalType; selfLevel: OnboardingSelfLevel };
  DiagnosticFlowScreen: { goalType: OnboardingGoalType; initialDifficulty?: 'A1' | 'A2' | 'B1' | 'B2' };
  DiagnosticResultScreen: { goalType: OnboardingGoalType; selfLevel: OnboardingSelfLevel };
  PathPreparationScreen: {
    nextRoute: keyof MainStackParamList;
    nextParams?: Record<string, unknown>;
  };
  LearningHubScreen: undefined;
  FocusSessionScreen:
    | {
        lessonId?: string;
        strictMode?: boolean;
      }
    | undefined;
  AITeacherSessionScreen:
    | {
        lessonId?: string;
      }
    | undefined;
  A1FoundationScreen: undefined;
  BeginnerFoundationScreen: undefined;
  FoundationLessonScreen: { lessonId: string };
  A1Lesson1Screen: undefined;
  A1ModuleLessonScreen: { lessonId: string };
  A2ModuleLessonScreen: { lessonId: string };
  B1ModuleLessonScreen: { lessonId: string };
  CLBModuleLessonScreen: { lessonId: string };
  A1Lesson3Screen: undefined;
  PathMapScreen:
    | {
        completionSummary?: LessonCompletionSummaryParams;
      }
    | undefined;
  UpgradeScreen: undefined;
  ModuleReviewScreen: undefined;
  LevelUnlockScreen: undefined;
};

export type PathStackParamList = {
  LearningHubScreen: undefined;
  DiagnosticFlowScreen: { goalType: OnboardingGoalType; initialDifficulty?: 'A1' | 'A2' | 'B1' | 'B2' };
  BeginnerFoundationScreen: undefined;
  A1FoundationScreen: undefined;
  A1Lesson1Screen: undefined;
  A1ModuleLessonScreen: { lessonId: string };
  A2ModuleLessonScreen: { lessonId: string };
  B1ModuleLessonScreen: { lessonId: string };
  CLBModuleLessonScreen: { lessonId: string };
  A1Lesson3Screen: undefined;
  PathMapScreen:
    | {
        completionSummary?: LessonCompletionSummaryParams;
      }
    | undefined;
  UpgradeScreen: undefined;
  ModuleReviewScreen: undefined;
  LevelUnlockScreen: undefined;
  FoundationLessonScreen: { lessonId: string };
};

export type PracticeStackParamList = {
  PracticeHubScreen: undefined;
  TeacherScriptsScreen: undefined;
  SpeedRecallScreen: undefined;
  ErrorHunterScreen: undefined;
  FrenchReflexRunScreen: undefined;
  FocusSessionScreen:
    | {
        lessonId?: string;
        strictMode?: boolean;
      }
    | undefined;
  AITeacherSessionScreen:
    | {
        lessonId?: string;
      }
    | undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  PrivacyPolicyScreen: undefined;
  ContactUsScreen: undefined;
  ImmigrationServicesScreen: undefined;
  SubscriptionScreen: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  PathTab: NavigatorScreenParams<PathStackParamList> | undefined;
  PracticeTab: NavigatorScreenParams<PracticeStackParamList> | undefined;
  ProfileTab: undefined;
};

// Compatibility type for existing screen components; preserves route-name typings without changing screen logic.
export type MainStackParamList = OnboardingStackParamList &
  PathStackParamList &
  PracticeStackParamList & {
    LearningHubScreen: undefined;
  };

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const PathStack = createNativeStackNavigator<PathStackParamList>();
const PracticeStack = createNativeStackNavigator<PracticeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const DEFAULT_MAIN_ROUTE: PersistedMainRoute = { tab: 'HomeTab', nested: { name: 'LearningHubScreen' } };
const APP_SPLASH_MS = 2000;
const TESTER_EMAIL_FOUNDATION4 = 'ztalentrecruitmentservices@gmail.com';
const TESTER_FOUNDATION4_ROUTE: PersistedMainRoute = {
  tab: 'PathTab',
  nested: { name: 'FoundationLessonScreen', params: { lessonId: 'numbers-0-20' } }
};

function onboardingKey(userId: string) {
  return `clb:onboarding-completed:${userId}`;
}

async function loadOnboardingCompleted(userId: string): Promise<boolean> {
  const cloud = await loadCloudProfileState(userId);
  if (typeof cloud?.onboardingCompleted === 'boolean') {
    const value = cloud.onboardingCompleted;
    await AsyncStorage.setItem(onboardingKey(userId), value ? 'true' : 'false');
    return value;
  }

  const raw = await AsyncStorage.getItem(onboardingKey(userId));
  return raw === 'true';
}

async function saveOnboardingCompleted(userId: string, value: boolean): Promise<void> {
  await AsyncStorage.setItem(onboardingKey(userId), value ? 'true' : 'false');
  try {
    await saveCloudOnboardingCompleted(userId, value);
  } catch {
    // local onboarding flag remains fallback when cloud write fails
  }
}

function screenOptions() {
  return {
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.textPrimary,
    headerTitleStyle: { fontWeight: '600' as const },
    contentStyle: { backgroundColor: colors.background }
  };
}

function tabIcon(icon: string) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
    </View>
  );
}

function OnboardingRedirectToSelfAssessment({ navigation }: { navigation: any }) {
  useEffect(() => {
    navigation.replace('SelfAssessmentScreen');
  }, [navigation]);

  return <AuthBootstrapScreen />;
}

function OnboardingCompletionBridge() {
  return <AuthBootstrapScreen />;
}

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="LoginScreen" screenOptions={screenOptions()}>
      <AuthStack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="RegisterScreen" component={RegisterScreen} options={{ title: 'Register' }} />
    </AuthStack.Navigator>
  );
}

function OnboardingRouteTracker({
  userId,
  onCompleted
}: {
  userId: string;
  onCompleted: (nextRoute: PersistedMainRoute) => void;
}) {
  const state = useNavigationState((s) => s);

  useEffect(() => {
    const routeName = getDeepestRouteName(state);
    const completionRoutes = new Set([
      'DiagnosticResultScreen',
      'LearningHubScreen',
      'BeginnerFoundationScreen',
      'A1FoundationScreen',
      'FoundationLessonScreen',
      'A1Lesson1Screen',
      'A1Lesson3Screen',
      'A1ModuleLessonScreen',
      'A2ModuleLessonScreen',
      'B1ModuleLessonScreen',
      'CLBModuleLessonScreen',
      'PathMapScreen',
      'FocusSessionScreen',
      'AITeacherSessionScreen'
    ]);

    const routeForMainTabs = (() => {
      if (!routeName) return DEFAULT_MAIN_ROUTE;
      if (routeName === 'FoundationLessonScreen') {
        return {
          tab: 'PathTab' as const,
          nested: { name: 'FoundationLessonScreen' as const, params: { lessonId: 'alphabet-sounds' } }
        };
      }
      if (routeName === 'DiagnosticFlowScreen') {
        return {
          tab: 'PathTab' as const,
          nested: {
            name: 'DiagnosticFlowScreen' as const,
            params: { goalType: 'tef_canada', initialDifficulty: 'A2' as const }
          }
        };
      }
      if (
        routeName === 'BeginnerFoundationScreen' ||
        routeName === 'A1FoundationScreen' ||
        routeName === 'A1Lesson1Screen' ||
        routeName === 'A1Lesson3Screen' ||
        routeName === 'A1ModuleLessonScreen' ||
        routeName === 'A2ModuleLessonScreen' ||
        routeName === 'B1ModuleLessonScreen' ||
        routeName === 'CLBModuleLessonScreen' ||
        routeName === 'PathMapScreen'
      ) {
        return { tab: 'PathTab' as const, nested: { name: 'PathMapScreen' as const } };
      }
      if (routeName === 'FocusSessionScreen' || routeName === 'AITeacherSessionScreen') {
        return { tab: 'PracticeTab' as const, nested: { name: 'PracticeHubScreen' as const } };
      }
      return DEFAULT_MAIN_ROUTE;
    })();

    if (routeName && completionRoutes.has(routeName)) {
      void Promise.all([
        saveOnboardingCompleted(userId, true),
        saveLastMainRoute(userId, routeForMainTabs)
      ])
        .catch(() => undefined)
        .finally(() => onCompleted(routeForMainTabs));
    }
  }, [state, userId, onCompleted]);

  return null;
}

function OnboardingStackNavigator({
  userId,
  onCompleted
}: {
  userId: string;
  onCompleted: (nextRoute: PersistedMainRoute) => void;
}) {
  return (
    <View style={styles.mainWrap}>
      <OnboardingStack.Navigator initialRouteName="WelcomeScreen" screenOptions={screenOptions()}>
        <OnboardingStack.Screen name="WelcomeScreen" component={WelcomeScreen} options={{ title: 'Start' }} />
        <OnboardingStack.Screen name="SelfAssessmentScreen" component={SelfAssessmentScreen} options={{ title: 'Goal' }} />
        <OnboardingStack.Screen name="DiagnosticFlowScreen" component={DiagnosticFlowScreen} options={{ title: 'Current Level' }} />
        <OnboardingStack.Screen name="StudyPlanIntroScreen" component={StudyPlanIntroScreen} options={{ title: 'Structure' }} />
        <OnboardingStack.Screen name="DiagnosticResultScreen" component={DiagnosticResultScreen} options={{ title: 'Reminder', gestureEnabled: false }} />
        <OnboardingStack.Screen
          name="PathPreparationScreen"
          component={PathPreparationScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <OnboardingStack.Screen
          name="LearningHubScreen"
          component={OnboardingCompletionBridge}
          options={{ headerShown: false }}
        />
        <OnboardingStack.Screen
          name="FocusSessionScreen"
          component={OnboardingRedirectToSelfAssessment}
          options={{ headerShown: false }}
        />
        <OnboardingStack.Screen
          name="AITeacherSessionScreen"
          component={AITeacherSessionScreen as React.ComponentType<any>}
          options={{ title: 'AI Teacher Session' }}
        />
        <OnboardingStack.Screen
          name="A1FoundationScreen"
          component={A1FoundationScreen as React.ComponentType<any>}
          options={{ title: 'A1 Foundation' }}
        />
        <OnboardingStack.Screen
          name="BeginnerFoundationScreen"
          component={BeginnerFoundationScreen as React.ComponentType<any>}
          options={{ title: 'Foundation Path' }}
        />
        <OnboardingStack.Screen
          name="FoundationLessonScreen"
          component={FoundationLessonScreen as React.ComponentType<any>}
          options={{ title: 'Foundation Lesson' }}
        />
        <OnboardingStack.Screen
          name="A1Lesson1Screen"
          component={A1Lesson1Screen as React.ComponentType<any>}
          options={{ title: 'A1 Lesson 1' }}
        />
        <OnboardingStack.Screen
          name="A1ModuleLessonScreen"
          component={A1ModuleLessonScreen as React.ComponentType<any>}
          options={{ title: 'A1 Module Lesson' }}
        />
        <OnboardingStack.Screen
          name="A2ModuleLessonScreen"
          component={A2ModuleLessonScreen as React.ComponentType<any>}
          options={{ title: 'A2 Module Lesson' }}
        />
        <OnboardingStack.Screen
          name="B1ModuleLessonScreen"
          component={B1ModuleLessonScreen as React.ComponentType<any>}
          options={{ title: 'B1 Module Lesson' }}
        />
        <OnboardingStack.Screen
          name="CLBModuleLessonScreen"
          component={CLBModuleLessonScreen as React.ComponentType<any>}
          options={{ title: 'CLB Module Lesson' }}
        />
        <OnboardingStack.Screen
          name="A1Lesson3Screen"
          component={A1Lesson3Screen as React.ComponentType<any>}
          options={{ title: 'A1 Lesson 3' }}
        />
        <OnboardingStack.Screen
          name="UpgradeScreen"
          component={UpgradeScreen as React.ComponentType<any>}
          options={{ title: 'Franco Pro' }}
        />
        <OnboardingStack.Screen
          name="ModuleReviewScreen"
          component={ModuleReviewScreen as React.ComponentType<any>}
          options={{ title: 'Module Review' }}
        />
        <OnboardingStack.Screen
          name="LevelUnlockScreen"
          component={LevelUnlockScreen as React.ComponentType<any>}
          options={{ title: 'Level Unlock' }}
        />
      </OnboardingStack.Navigator>
      <OnboardingRouteTracker userId={userId} onCompleted={onCompleted} />
      <GlobalFocusTimerBar />
      {Platform.OS !== 'web' ? <CompanionAssistant /> : null}
    </View>
  );
}

function HomeStackNavigator() {
  return (
    <PathStack.Navigator screenOptions={screenOptions()}>
      <PathStack.Screen name="LearningHubScreen" component={HomeDashboardScreen} options={{ title: 'Home' }} />
    </PathStack.Navigator>
  );
}

function PathStackNavigator() {
  return (
    <PathStack.Navigator screenOptions={screenOptions()}>
      <PathStack.Screen
        name="PathMapScreen"
        component={PathMapScreen as React.ComponentType<any>}
        options={{ title: 'Path' }}
      />
      <PathStack.Screen
        name="DiagnosticFlowScreen"
        component={DiagnosticFlowScreen as React.ComponentType<any>}
        options={{ title: 'Assessment' }}
      />
      <PathStack.Screen
        name="LearningHubScreen"
        component={HomeDashboardScreen as React.ComponentType<any>}
        options={{ title: 'Home' }}
      />
      <PathStack.Screen
        name="BeginnerFoundationScreen"
        component={BeginnerFoundationScreen}
        options={{ title: 'Foundation Path' }}
      />
      <PathStack.Screen
        name="A1FoundationScreen"
        component={A1FoundationScreen}
        options={{ title: 'A1 Foundation' }}
      />
      <PathStack.Screen
        name="A1Lesson1Screen"
        component={A1Lesson1Screen}
        options={{ title: 'A1 Lesson 1' }}
      />
      <PathStack.Screen
        name="A1ModuleLessonScreen"
        component={A1ModuleLessonScreen as React.ComponentType<any>}
        options={{ title: 'A1 Module Lesson' }}
      />
      <PathStack.Screen
        name="A2ModuleLessonScreen"
        component={A2ModuleLessonScreen as React.ComponentType<any>}
        options={{ title: 'A2 Module Lesson' }}
      />
      <PathStack.Screen
        name="B1ModuleLessonScreen"
        component={B1ModuleLessonScreen as React.ComponentType<any>}
        options={{ title: 'B1 Module Lesson' }}
      />
      <PathStack.Screen
        name="CLBModuleLessonScreen"
        component={CLBModuleLessonScreen as React.ComponentType<any>}
        options={{ title: 'CLB Module Lesson' }}
      />
      <PathStack.Screen name="A1Lesson3Screen" component={A1Lesson3Screen as React.ComponentType<any>} options={{ title: 'A1 Lesson 3' }} />
      <PathStack.Screen name="UpgradeScreen" component={UpgradeScreen as React.ComponentType<any>} options={{ title: 'Franco Pro' }} />
      <PathStack.Screen name="ModuleReviewScreen" component={ModuleReviewScreen as React.ComponentType<any>} options={{ title: 'Module Review' }} />
      <PathStack.Screen name="LevelUnlockScreen" component={LevelUnlockScreen as React.ComponentType<any>} options={{ title: 'Level Unlock' }} />
      <PathStack.Screen
        name="FoundationLessonScreen"
        component={FoundationLessonScreen}
        options={{ title: 'Foundation Lesson' }}
      />
    </PathStack.Navigator>
  );
}

function PracticeStackNavigator() {
  return (
    <PracticeStack.Navigator screenOptions={screenOptions()}>
      <PracticeStack.Screen
        name="PracticeHubScreen"
        component={PracticeHubScreen as React.ComponentType<any>}
        options={{ title: 'Practice' }}
      />
      <PracticeStack.Screen
        name="TeacherScriptsScreen"
        component={TeacherScriptsScreen as React.ComponentType<any>}
        options={{ title: 'Teacher Scripts' }}
      />
      <PracticeStack.Screen
        name="SpeedRecallScreen"
        component={SpeedRecallScreen as React.ComponentType<any>}
        options={{ title: 'Speed Recall' }}
      />
      <PracticeStack.Screen
        name="ErrorHunterScreen"
        component={ErrorHunterScreen as React.ComponentType<any>}
        options={{ title: 'Error Hunter' }}
      />
      <PracticeStack.Screen
        name="FrenchReflexRunScreen"
        component={FrenchReflexRunScreen as React.ComponentType<any>}
        options={{ title: 'French Reflex Run' }}
      />
      <PracticeStack.Screen
        name="FocusSessionScreen"
        component={FocusSessionScreen as React.ComponentType<any>}
        options={{ title: 'Focus Session' }}
      />
      <PracticeStack.Screen
        name="AITeacherSessionScreen"
        component={AITeacherSessionScreen as React.ComponentType<any>}
        options={{ title: 'AI Teacher Session' }}
      />
    </PracticeStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={screenOptions()}>
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
      <ProfileStack.Screen name="ContactUsScreen" component={ContactUsScreen} options={{ title: 'Contact Us' }} />
      <ProfileStack.Screen
        name="ImmigrationServicesScreen"
        component={ImmigrationServicesScreen}
        options={{ title: 'Immigration Services' }}
      />
      <ProfileStack.Screen name="SubscriptionScreen" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
    </ProfileStack.Navigator>
  );
}

function extractPersistedMainRoute(state: NavigationState | undefined): PersistedMainRoute | null {
  if (!state) {
    return null;
  }

  const tabRoute = state.routes[state.index ?? 0];
  if (!tabRoute) {
    return null;
  }

  const tabName = tabRoute.name as PersistedMainRoute['tab'];
  const nestedState = (tabRoute.state as NavigationState | undefined) ?? undefined;
  const nestedRoute = nestedState ? nestedState.routes[nestedState.index ?? 0] : undefined;

  if (!nestedRoute) {
    return { tab: tabName };
  }

  return {
    tab: tabName,
    nested: {
      name: nestedRoute.name as NonNullable<PersistedMainRoute['nested']>['name'],
      // params are validated before persistence in routePersistence.ts
      params: nestedRoute.params
    }
  };
}

function getDeepestRouteName(state: NavigationState | undefined): string | undefined {
  if (!state?.routes?.length) {
    return undefined;
  }

  const route = state.routes[state.index ?? 0] as { name: string; state?: NavigationState };
  if (route.state) {
    return getDeepestRouteName(route.state) ?? route.name;
  }

  return route.name;
}

function MainTabsRouteTracker({ userId }: { userId: string }) {
  const state = useNavigationState((s) => s);

  useEffect(() => {
    const persisted = extractPersistedMainRoute(state);
    if (!persisted) {
      return;
    }

    void saveLastMainRoute(userId, persisted);
  }, [state, userId]);

  return null;
}

function MainTabsNavigator({ userId, initialRoute }: { userId: string; initialRoute: PersistedMainRoute }) {
  return (
    <View style={styles.mainWrap}>
      <Tab.Navigator
        initialRouteName={initialRoute.tab}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackNavigator}
          options={{ tabBarLabel: 'Home', tabBarIcon: tabIcon('home-variant') }}
        />
        <Tab.Screen
          name="PathTab"
          component={PathStackNavigator}
          initialParams={
            initialRoute.tab === 'PathTab' && initialRoute.nested
              ? ({ screen: initialRoute.nested.name, params: initialRoute.nested.params } as any)
              : undefined
          }
          options={{ tabBarLabel: 'Path', tabBarIcon: tabIcon('map-marker-path') }}
        />
        <Tab.Screen
          name="PracticeTab"
          component={PracticeStackNavigator}
          initialParams={
            initialRoute.tab === 'PracticeTab' && initialRoute.nested
              ? ({ screen: initialRoute.nested.name, params: initialRoute.nested.params } as any)
              : undefined
          }
          listeners={({ navigation }) => ({
            tabPress: (event) => {
              event.preventDefault();
              navigation.navigate('PracticeTab', { screen: 'PracticeHubScreen' } as never);
            }
          })}
          options={{ tabBarLabel: 'Practice', tabBarIcon: tabIcon('target') }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{ tabBarLabel: 'Profile', tabBarIcon: tabIcon('account-circle') }}
        />
      </Tab.Navigator>
      <MainTabsRouteTracker userId={userId} />
      <GlobalFocusTimerBar />
      {Platform.OS !== 'web' ? <CompanionAssistant /> : null}
    </View>
  );
}

function AuthBootstrapScreen() {
  return (
    <View style={styles.bootstrap}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function BrandSplashScreen() {
  const pulse = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.brandSplashRoot}>
      <Animated.View style={[styles.brandSplashMark, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.brandSplashMarkEmoji}>🍁</Text>
      </Animated.View>
      <Text style={styles.brandSplashName}>FRANCO</Text>
      <Text style={styles.brandSplashSub}>Powered by Jungle Labs</Text>
    </View>
  );
}

export function AppNavigator() {
  const { user, initializing } = useAuth();
  const [restoreReady, setRestoreReady] = useState(false);
  const [mainRoute, setMainRoute] = useState<PersistedMainRoute>(DEFAULT_MAIN_ROUTE);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (!user) {
      setRestoreReady(true);
      setMainRoute(DEFAULT_MAIN_ROUTE);
      setOnboardingCompleted(false);
      return;
    }

    if ((user.email ?? '').trim().toLowerCase() === TESTER_EMAIL_FOUNDATION4) {
      setMainRoute(TESTER_FOUNDATION4_ROUTE);
      setOnboardingCompleted(true);
      setRestoreReady(true);
      return;
    }

    setRestoreReady(false);

    (async () => {
      const [savedRoute, savedOnboarding, savedProfile] = await Promise.all([
        loadLastMainRoute(user.uid),
        loadOnboardingCompleted(user.uid),
        loadUserOnboardingProfile(user.uid)
      ]);

      setMainRoute(savedRoute ?? DEFAULT_MAIN_ROUTE);
      // Compatibility: old users may have a saved main route from before onboarding flag was added.
      setOnboardingCompleted(savedOnboarding || savedProfile?.hasCompletedOnboarding === true || Boolean(savedRoute));
      setRestoreReady(true);
    })();
  }, [user]);

  const showBootstrap = useMemo(() => initializing || (Boolean(user) && !restoreReady), [initializing, restoreReady, user]);

  useEffect(() => {
    if (showBootstrap) {
      setSplashDone(false);
      return;
    }

    const timer = setTimeout(() => setSplashDone(true), APP_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [showBootstrap]);

  if (showBootstrap) {
    return <AuthBootstrapScreen />;
  }

  if (!splashDone) {
    return <BrandSplashScreen />;
  }

  if (!user) {
    return <AuthStackNavigator />;
  }

  if (!onboardingCompleted) {
    return (
      <OnboardingStackNavigator
        userId={user.uid}
        onCompleted={(nextRoute) => {
          setMainRoute(nextRoute);
          setOnboardingCompleted(true);
        }}
      />
    );
  }

  return <MainTabsNavigator userId={user.uid} initialRoute={mainRoute} />;
}

const styles = StyleSheet.create({
  bootstrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  },
  mainWrap: {
    flex: 1
  },
  brandSplashRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.xl
  },
  brandSplashMark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg
  },
  brandSplashMarkEmoji: {
    fontSize: 38
  },
  brandSplashName: {
    ...typography.heading1,
    color: colors.primary,
    letterSpacing: 2.2
  },
  brandSplashSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: '#DCE5F2',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 70,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    paddingTop: 8
  },
  tabBarItem: {
    paddingVertical: 2
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600'
  },
  tabIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabIconWrapActive: {
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  }
});
