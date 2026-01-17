import { Checkbox, List, Text } from 'react-native-paper';
import React, { FC, useEffect } from 'react';
import {
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Chevron } from '../../../../components/Accordion';
import { useAppTheme } from '../../../../App/theming';
import { useStyles } from './ModeAccordion.styles';
import { View } from 'react-native';

export const ModeAccordion: FC<{
  title: string;
  description: string;
  descriptionSubtext: string;
  open: boolean;
  setOpen: () => void;
}> = ({ title, description, descriptionSubtext, open, setOpen }) => {
  const styles = useStyles();
  const { colors } = useAppTheme();
  const expanded = useSharedValue(false);
  const progress = useDerivedValue<number>(() =>
    expanded.value ? withSpring(1) : withSpring(0),
  );

  useEffect(() => {
    expanded.set(open);
  }, [expanded, open]);

  return (
    <List.Accordion
      descriptionNumberOfLines={0}
      style={styles.listItem}
      contentStyle={styles.listItemContent}
      containerStyle={styles.listItemContainer}
      title={title}
      titleStyle={styles.title}
      expanded={open}
      left={() => <Chevron progress={progress} />}
      right={() => (
        <Checkbox.Android
          status={open ? 'checked' : 'unchecked'}
          color={colors.onBackground}
          uncheckedColor={colors.onBackground}
        />
      )}
      onPress={setOpen}
    >
      <View style={styles.accordionContainer}>
        <Text style={styles.itemTitle}>{description}</Text>
        <Text style={styles.itemDescription}>{descriptionSubtext}</Text>
      </View>
    </List.Accordion>
  );
};
