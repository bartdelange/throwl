import React, { FC } from 'react';
import { Checkbox, List } from 'react-native-paper';
import { DoublesOptions } from '~/models/game';
import { useAppTheme } from '~/App/theming.tsx';
import { useStyles } from '~/screens/NewGame/GameOptions/components/DoublesOptions/DoublesOptions.styles.ts';

interface DoublesOptionsProps {
  saveOptions: (options: DoublesOptions) => void;
  options: DoublesOptions;
}

export const DoublesOptionsView: FC<DoublesOptionsProps> = ({ saveOptions, options }) => {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const onValueChange = (val: keyof DoublesOptions) => () => {
    saveOptions({ ...options, [val]: !options[val] });
  };

  const renderOption = (
    option: keyof Omit<DoublesOptions, 'mode'>,
    label: string,
    description: string,
  ) => {
    return (
      <List.Item
        onPress={onValueChange(option)}
        right={() => (
          <Checkbox.Android
            status={options[option] ? 'checked' : 'unchecked'}
            color={colors.onPrimary}
            uncheckedColor={colors.onPrimary}
            onPress={onValueChange(option)}
          />
        )}
        style={styles.listItem}
        contentStyle={styles.listItemContent}
        containerStyle={styles.listItemContainer}
        title={label}
        titleStyle={styles.itemTitle}
        description={description}
        descriptionStyle={styles.itemDescription}
      />
    );
  };

  return (
    <List.Section>
      {renderOption('quickMatch', 'Quick Match', 'Play until Double 10 instead of Double 1')}
      {renderOption('skipBull', 'Skip bull', "Bull and Bull's Eye aren't required to win")}
      {renderOption(
        'endOnInvalid',
        'End turn on invalid throw',
        'Turn will end if anything other then current double or "miss" has been thrown',
      )}
    </List.Section>
  );
};
