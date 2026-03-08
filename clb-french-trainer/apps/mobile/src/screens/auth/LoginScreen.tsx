import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { InputField } from '../../components/InputField';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/AppNavigator';
import { mapAuthError } from '../../services/authErrorMessages';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'LoginScreen'>;

type LoginErrors = {
  email?: string;
  password?: string;
  submit?: string;
};

export function LoginScreen({ navigation, route }: Props) {
  const { login, resendVerification } = useAuth();
  const [email, setEmail] = useState(route.params?.prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const notice = route.params?.notice;

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0 && !loading,
    [email, password, loading]
  );

  const handleLogin = async () => {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      setInfoMessage(null);
      await login(email.trim(), password);
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: mapAuthError(error) }));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (!password.trim()) {
      nextErrors.password = 'Password is required';
    }

    setErrors((prev) => ({ ...prev, ...nextErrors, submit: undefined }));
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setResending(true);
      setInfoMessage(null);
      await resendVerification(email.trim(), password);
      setInfoMessage('Verification email sent again. Please check inbox/spam and verify.');
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: mapAuthError(error) }));
    } finally {
      setResending(false);
    }
  };

  const content = (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>🍁</Text>
            </View>
            <Text style={styles.logo}>FRANCO</Text>
          </View>

          <Card>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>Continue your TEF Canada preparation journey.</Text>

            <InputField
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              label="Email"
              onChangeText={(value) => {
                setEmail(value);
                setErrors((prev) => ({ ...prev, email: undefined, submit: undefined }));
              }}
              placeholder="you@example.com"
              value={email}
              error={errors.email}
            />

            <InputField
              label="Password"
              onChangeText={(value) => {
                setPassword(value);
                setErrors((prev) => ({ ...prev, password: undefined, submit: undefined }));
              }}
              placeholder="Enter password"
              secureTextEntry
              value={password}
              error={errors.password}
            />

            {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
            {infoMessage ? <Text style={styles.noticeText}>{infoMessage}</Text> : null}
            {errors.submit ? <Text style={styles.submitError}>{errors.submit}</Text> : null}

            <View style={styles.actions}>
              <Button label="Login" onPress={handleLogin} disabled={!canSubmit} loading={loading} />
              <Button
                label="Resend Verification Email"
                onPress={handleResendVerification}
                variant="text"
                disabled={loading || resending}
                loading={resending}
              />
              <Button
                label="Register"
                onPress={() => navigation.navigate('RegisterScreen')}
                variant="outline"
                disabled={loading}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
  );

  if (Platform.OS === 'web') {
    return content;
  }

  return <TouchableWithoutFeedback onPress={Keyboard.dismiss}>{content}</TouchableWithoutFeedback>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandMarkText: {
    fontSize: 16
  },
  logo: {
    ...typography.heading2,
    textAlign: 'center',
    color: colors.primary,
    letterSpacing: 1.5
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl
  },
  submitError: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.md
  },
  noticeText: {
    ...typography.caption,
    color: colors.secondary,
    marginBottom: spacing.md
  },
  actions: {
    gap: spacing.md
  }
});
