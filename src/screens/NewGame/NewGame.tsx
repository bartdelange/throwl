import React, { useCallback } from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import { Divider, IconButton, Menu, Text, useTheme } from 'react-native-paper';
import { AuthContext } from '~/context/AuthContext';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { RouteProp, useNavigation } from '@react-navigation/core';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  HOME_SCREEN,
  NEW_GAME_SCREEN,
  PLAY_GAME_SCREEN,
  RootStackParamList,
} from '~/constants/navigation';
import { PlayerItem } from './components/PlayerItem/PlayerItem';
import { LogoButton } from '~/components/LogoButton/LogoButton';
import { makeStyles } from './styles';
import { useRoute } from '@react-navigation/native';

export const NewGameScreen: React.FC<{}> = () => {
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NEW_GAME'>>();
  const { user } = React.useContext(AuthContext);
  const [selectedUsers, _setSelectedUsers] = React.useState<string[]>(
    route.params?.selectedUsers || []
  );

  const setSelectedUsers = useCallback(
    (selectedUsers: string[] | ((current: string[]) => string[])) => {
      if (Array.isArray(selectedUsers)) {
        navigator.setParams({ selectedUsers });
        _setSelectedUsers(selectedUsers);
      } else {
        _setSelectedUsers(current => {
          const newUsers = selectedUsers(current);
          navigator.setParams({ selectedUsers: newUsers });
          return newUsers;
        });
      }
    },
    []
  );
  const [visible, setVisible] = React.useState(false);
  const styles = makeStyles();
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  if (!user) {
    navigator.replace(HOME_SCREEN);
    return <View />;
  }

  const randomizeSelected = () => {
    const newArray = selectedUsers.map(u => u);
    let currentIndex = newArray.length;
    let randomIndex = 0;

    while (currentIndex != 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex],
        newArray[currentIndex],
      ];
    }

    setSelectedUsers(newArray);
  };

  const players = [user, ...(user.friends || []).map(friend => friend.user)];

  return (
    <FullScreenLayout style={styles.layout}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.heading}>
            The Players
          </Text>
          <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
              <IconButton
                icon="menu"
                color="white"
                style={styles.menuButton}
                size={Math.max(50, Dimensions.get('window').width * 0.1)}
                onPress={openMenu}
              />
            }>
            <Menu.Item
              icon="dice-multiple"
              onPress={randomizeSelected}
              title="RANDOMIZE PLAYERS"
            />
            <Menu.Item
              icon="account-multiple"
              onPress={() => setSelectedUsers([])}
              title="CLEAR"
            />
          </Menu>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.playerList}>
          <FlatList
            data={players}
            keyExtractor={player => player.id}
            renderItem={({ item: player }) => (
              <View style={styles.player}>
                <PlayerItem
                  player={player}
                  selected={selectedUsers.includes(player.id)}
                  position={selectedUsers.indexOf(player.id) + 1}
                  onPress={() =>
                    setSelectedUsers(current => {
                      if (current.indexOf(player.id) >= 0) {
                        return current.filter(userId => userId !== player.id);
                      } else {
                        return [...current, player.id];
                      }
                    })
                  }
                />
              </View>
            )}
          />
        </View>
      </View>
      <View style={styles.goButton}>
        <LogoButton
          label="GO"
          size={Math.max(50, Dimensions.get('window').width * 0.1)}
          onPress={() =>
            navigator.push(PLAY_GAME_SCREEN, {
              selectedUsers,
            })
          }
        />
      </View>
    </FullScreenLayout>
  );
};
