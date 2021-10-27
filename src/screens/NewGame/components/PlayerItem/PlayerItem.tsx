import React from 'react';
import { Dimensions, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { List, Text } from 'react-native-paper';
import { makeStyles } from './styles';
import { User } from '~/models/user';

interface PlayerItemProps {
  player: Omit<User, 'friends'>;
  selected: boolean;
  onPress?: () => void;
  position?: number;
}

export const PlayerItem: React.FC<PlayerItemProps> = ({
  player,
  selected,
  onPress = () => null,
  position,
}) => {
  const bouncyCheckboxRef = React.useRef<BouncyCheckbox>();
  const styles = makeStyles();

  return (
    <List.Item
      titleStyle={styles.player}
      key={player.id}
      title={player.name}
      onPress={() => {
        bouncyCheckboxRef.current?.onPress();
      }}
      right={props => (
        <BouncyCheckbox
          // @ts-ignore
          ref={bouncyCheckboxRef}
          fillColor="transparent"
          iconStyle={styles.iconStyle}
          ImageComponent={
            position
              ? () => (
                  <View style={styles.positionStyle}>
                    <Text
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      style={styles.positionTextStyle}>
                      {position}
                    </Text>
                  </View>
                )
              : undefined
          }
          size={Math.max(Dimensions.get('window').width * 0.05, 24)}
          textStyle={styles.player}
          isChecked={selected}
          disableBuiltInState
          onPress={() => {
            onPress();
          }}
          // iconComponent=
          textContainerStyle={{}}
          key={player.id}
        />
      )}
    />
  );
};
