import React, { FC, PropsWithChildren, useEffect } from 'react';
import { StyleProp, TextStyle, View } from 'react-native';

import { useStyles } from './styles';
import { List } from 'react-native-paper';
import { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { Chevron } from '~/components/Accordion';

interface AccordionProps {
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  subtitle?: string;
  subtitleStyle?: StyleProp<TextStyle>;
  open?: boolean;
  onChange?: () => void;
}

export const Accordion: FC<PropsWithChildren<AccordionProps>> = ({
  title,
  titleStyle,
  subtitle,
  subtitleStyle,
  open: isOpen,
  onChange = () => null,
  children,
}) => {
  const styles = useStyles();
  const open = useSharedValue(false);
  const progress = useDerivedValue<number>(() => (open.value ? withSpring(1) : withSpring(0)));

  useEffect(() => {
    open.set(!!isOpen);
  }, [isOpen, open]);

  return (
    <View style={styles.wrapper}>
      <List.Accordion
        title={title}
        description={subtitle}
        titleStyle={[styles.title, titleStyle]}
        style={styles.container}
        descriptionStyle={[styles.subtitle, subtitleStyle]}
        right={() => <Chevron progress={progress} />}
        expanded={isOpen}
        onPress={onChange}
      >
        <View style={styles.content}>{children}</View>
      </List.Accordion>
    </View>
  );
};
