import React from 'react';
import {
  StyleProp,
  Text,
  TextStyle,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Chevron } from '../Chevron/Chevron';
import { makeStyles } from './styles';

interface AccordionProps {
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  subtitle?: string;
  subtitleStyle?: StyleProp<TextStyle>;
  open?: boolean;
  onChange?: () => void;
}

export const Accordion: React.FC<React.PropsWithChildren<AccordionProps>> = ({
  title,
  titleStyle,
  subtitle,
  subtitleStyle,
  open: isOpen,
  onChange = () => null,
  children,
}) => {
  const styles = makeStyles();
  const accordionContentRef = useAnimatedRef<View>();
  const open = useSharedValue(false);
  const progress = useDerivedValue(() =>
    open.value ? withSpring(1) : withTiming(0)
  );
  const height = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    borderBottomLeftRadius: progress.value === 0 ? 8 : 0,
    borderBottomRightRadius: progress.value === 0 ? 8 : 0,
  }));
  const style = useAnimatedStyle(() => ({
    height: height.value * progress.value + 1,
    opacity: progress.value === 0 ? 0 : 1,
  }));

  React.useEffect(() => {
    open.value = !!isOpen;
  }, [isOpen]);

  return (
    <>
      <TouchableWithoutFeedback
        onPress={() => {
          open.value = !open.value;
          onChange();
        }}>
        <Animated.View style={[styles.container, headerStyle]}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
          <Chevron progress={progress} />
        </Animated.View>
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.content, style]}>
        <View
          ref={accordionContentRef}
          onLayout={({
            nativeEvent: {
              layout: { height: h },
            },
          }) => {
            if (height.value < h) {
              height.value = h;
            }
          }}>
          {children}
        </View>
      </Animated.View>
    </>
  );
};
