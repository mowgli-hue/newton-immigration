import React from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';

type Props = {
  children: React.ReactNode;
};

export function StepContainer({ children }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#FFFFFFEE',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  content: {
    flexGrow: 1
  }
});
