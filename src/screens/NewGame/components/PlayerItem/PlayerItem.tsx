import React from 'react';
import { Dimensions, View } from 'react-native';
import BouncyCheckbox, {
    BouncyCheckboxHandle,
} from 'react-native-bouncy-checkbox';
import { List, Text } from 'react-native-paper';
import { User } from '~/models/user';
import { makeStyles } from './styles';

interface PlayerItemProps {
    player: Omit<User, 'friends' | 'email' | 'type'>;
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
    const bouncyCheckboxRef = React.useRef<BouncyCheckboxHandle>(null);
    const styles = makeStyles();

    return (
        <List.Item
            titleStyle={styles.player}
            key={player.id}
            title={player.name}
            onPress={() => {
                bouncyCheckboxRef.current?.onCheckboxPress();
            }}
            right={_ => (
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
                                          allowFontScaling={false}
                                          adjustsFontSizeToFit={true}
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
                    useBuiltInState={false}
                    isChecked={selected}
                    onPress={() => {
                        onPress();
                    }}
                    textContainerStyle={{}}
                    key={player.id}
                />
            )}
        />
    );
};
