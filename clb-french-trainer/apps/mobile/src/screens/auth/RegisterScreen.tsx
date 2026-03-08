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

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterScreen'>;

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
};

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => !!name.trim() && !!email.trim() && !!password.trim() && !!confirmPassword.trim() && !loading,
    [name, email, password, confirmPassword, loading]
  );

  const handleRegister = async () => {
    const nextErrors: RegisterErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Confirm your password';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      await register(name, email.trim(), password);
      navigation.navigate('LoginScreen', {
        prefillEmail: email.trim(),
        notice: 'Verification email sent. Please verify your email, then login.'
      });
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: mapAuthError(error) }));
    } finally {
      setLoading(false);
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
            <Text style={styles.brandName}>FRANCO</Text>
          </View>

          <Card>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Set up your CLB-focused TEF Canada preparation profile.</Text>

            <InputField
              label="Full name"
              onChangeText={(value) => {
                setName(value);
                setErrors((prev) => ({ ...prev, name: undefined, submit: undefined }));
              }}
              placeholder="Your full name"
              value={name}
              error={errors.name}
            />

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
              placeholder="Create a password"
              secureTextEntry
              value={password}
              error={errors.password}
            />

            <InputField
              label="Confirm password"
              onChangeText={(value) => {
                setConfirmPassword(value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined, submit: undefined }));
              }}
              placeholder="Re-enter your password"
              secureTextEntry
              value={confirmPassword}
              error={errors.confirmPassword}
            />

            {errors.submit ? <Text style={styles.submitError}>{errors.submit}</Text> : null}

            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>
                We send a welcome email after registration and enable study reminders + weekly progress emails by default. You can change this later in Profile.
              </Text>
            </View>

            <View style={styles.actions}>
              <Button label="Register" onPress={handleRegister} disabled={!canSubmit} loading={loading} />
              <Button
                label="Back to Login"
                onPress={() => navigation.navigate('LoginScreen')}
                variant="text"
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
    gap: spacing.lg
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
  brandName: {
    ...typography.heading2,
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
  infoNote: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md
  },
  infoNoteText: {
    ...typography.caption,
    color: colors.textSecondary
  },
  actions: {
    gap: spacing.sm
  }
});
