import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
};

export function AnimatedSuccess({ visible }: Props) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.7);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 130 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true })
    ]).start();
  }, [visible, opacity, scale]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }], opacity }]}> 
      <View style={styles.bubble}><Text style={styles.icon}>✓</Text></View>
      <Text style={styles.label}>Great</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 14,
    right: 18,
    alignItems: 'center'
  },
  bubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  label: {
    marginTop: 3,
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700'
  }
});
