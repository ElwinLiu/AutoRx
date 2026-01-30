import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppTheme } from '@/hooks/use-app-theme';

const SPRING_CONFIG = {
  damping: 30,
  stiffness: 200,
  mass: 0.8,
};

type TabItem = {
  key: string;
  label: string;
};

type SwipeableTabsProps = {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children: React.ReactNode[];
};

export function SwipeableTabs({ tabs, activeTab, onTabChange, children }: SwipeableTabsProps) {
  const { width } = useWindowDimensions();
  const { colors, spacing, radius, typography } = useAppTheme();
  const activeIndex = tabs.findIndex((t) => t.key === activeTab);
  const translateX = useSharedValue(-activeIndex * width);
  const contextX = useRef(0);

  useEffect(() => {
    const newIndex = tabs.findIndex((t) => t.key === activeTab);
    translateX.value = withSpring(-newIndex * width, SPRING_CONFIG);
  }, [activeTab, tabs, width, translateX]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onBegin(() => {
      contextX.current = translateX.value;
    })
    .onUpdate((event) => {
      const newTranslateX = contextX.current + event.translationX;
      const maxTranslate = 0;
      const minTranslate = -(tabs.length - 1) * width;
      translateX.value = Math.max(minTranslate, Math.min(maxTranslate, newTranslateX));
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const currentOffset = -translateX.value;
      const currentIndex = Math.round(currentOffset / width);

      let newIndex = currentIndex;
      if (Math.abs(velocity) > 500) {
        if (velocity < 0) {
          newIndex = Math.min(tabs.length - 1, currentIndex + 1);
        } else {
          newIndex = Math.max(0, currentIndex - 1);
        }
      } else {
        newIndex = Math.max(0, Math.min(tabs.length - 1, currentIndex));
      }

      translateX.value = withSpring(-newIndex * width, SPRING_CONFIG);
      runOnJS(onTabChange)(tabs[newIndex].key);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    const activeIdx = tabs.findIndex((t) => t.key === activeTab);
    return {
      transform: [{ translateX: activeIdx * (width / tabs.length) }],
    };
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xl,
      marginBottom: spacing.md,
      position: 'relative',
    },
    tabButton: {
      paddingVertical: spacing.sm,
    },
    tabText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    indicator: {
      position: 'absolute',
      bottom: 0,
      width: 60,
      height: 3,
      backgroundColor: colors.textPrimary,
      borderRadius: radius.pill,
      alignSelf: 'center',
    },
    contentContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    tabContent: {
      width,
      flex: 1,
    },
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={styles.tabButton}
          >
            <Animated.Text
              style={[
                styles.tabText,
                tab.key === activeTab && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Animated.Text>
          </Pressable>
        ))}
        <Animated.View style={[styles.indicator, indicatorAnimatedStyle]} />
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.contentContainer, animatedStyle]}>
          {children.map((child, index) => (
            <View key={tabs[index]?.key || index} style={styles.tabContent}>
              {child}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
