import React from 'react';
import { StyleProp, TextStyle, View } from 'react-native';

import { makeStyles } from './styles';
import { List } from 'react-native-paper';
import {
  useSharedValue,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { Chevron } from '~/components/Accordion';

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
  const open = useSharedValue(false);
  const progress = useDerivedValue<number>(() =>
    open.value ? withSpring(1) : withSpring(0)
  );

  React.useEffect(() => {
    open.set(!!isOpen);
  }, [isOpen]);

  return (
    <View style={styles.wrapper}>
      <List.Accordion
        title={title}
        description={subtitle}
        titleStyle={[styles.title, titleStyle]}
        style={styles.container}
        descriptionStyle={[styles.subtitle, subtitleStyle]}
        right={_ => <Chevron progress={progress} />}
        expanded={isOpen}
        onPress={onChange}>
        <View style={[styles.content]}>{children}</View>
      </List.Accordion>
    </View>
  );
};
