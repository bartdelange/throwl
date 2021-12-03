import { RouteProp, useNavigation } from '@react-navigation/core';
import { useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { Dimensions, FlatList, View } from 'react-native';
import {
  Divider,
  IconButton,
  Menu,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppModal } from '~/components/AppModal/AppModal';
import { LogoButton } from '~/components/LogoButton/LogoButton';
import {
  HOME_SCREEN,
  PLAY_GAME_SCREEN,
  RootStackParamList,
} from '~/constants/navigation';
import { AuthContext } from '~/context/AuthContext';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { PlayerItem } from './components/PlayerItem/PlayerItem';
import { makeStyles } from './styles';

export const NewGameScreen: React.FC = () => {
  const navigator =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NEW_GAME'>>();
  const { user } = React.useContext(AuthContext);
  const [selectedUsers, _setSelectedUsers] = React.useState<string[]>(
    route.params?.selectedUsers || []
  );
  const [customGameScoreOpen, setCustomGameScoreOpen] = React.useState(false);
  const [gameStartingScore, setGameStartingScore] = React.useState(501);

  const setSelectedUsers = useCallback(
    (selectedUsers: string[] | ((current: string[]) => string[])) => {
      if (Array.isArray(selectedUsers)) {
        _setSelectedUsers(selectedUsers);
      } else {
        _setSelectedUsers(current => {
          const newUsers = selectedUsers(current);
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

  const players = [
    { ...user, friends: undefined },
    ...(user.friends || []).map(friend => friend.user),
  ];

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
            <Menu.Item
              icon="scoreboard-outline"
              onPress={() => setCustomGameScoreOpen(true)}
              title="SET STARTING SCORE"
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
          disabled={!selectedUsers.length}
          onPress={() => {
            navigator.setParams({ selectedUsers });
            navigator.push(PLAY_GAME_SCREEN, {
              players: players.filter(p => selectedUsers.includes(p.id)),
              startingScore: 501,
            });
          }}
        />
      </View>
      <AppModal
        visible={customGameScoreOpen}
        titleIcon="scoreboard-outline"
        title="STARTING SCORE"
        onDismiss={() => setCustomGameScoreOpen(false)}
        actions={
          <View>
            <View style={styles.scoreButtonRow}>
              <View
                style={[styles.scoreButtonWrapper, styles.scorePreviewWrapper]}>
                <Text style={styles.scoreButtonText}>{gameStartingScore}</Text>
              </View>
              <View style={styles.scoreButtonWrapper}>
                <MaterialCommunityIcons
                  style={styles.scoreRemoveButton}
                  name="backspace-outline"
                />
              </View>
            </View>
            <View style={styles.scoreButtonRow}>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(1)}>
                <Text style={styles.scoreButtonText}>1</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(2)}>
                <Text style={styles.scoreButtonText}>2</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(3)}>
                <Text style={styles.scoreButtonText}>3</Text>
              </TouchableRipple>
            </View>
            <View style={styles.scoreButtonRow}>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(4)}>
                <Text style={styles.scoreButtonText}>4</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(5)}>
                <Text style={styles.scoreButtonText}>5</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(6)}>
                <Text style={styles.scoreButtonText}>6</Text>
              </TouchableRipple>
            </View>
            <View style={styles.scoreButtonRow}>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(7)}>
                <Text style={styles.scoreButtonText}>7</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(8)}>
                <Text style={styles.scoreButtonText}>8</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(9)}>
                <Text style={styles.scoreButtonText}>9</Text>
              </TouchableRipple>
            </View>
            <View style={styles.scoreButtonRow}>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(501)}>
                <Text style={styles.scoreButtonText}>501</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(0)}>
                <Text style={styles.scoreButtonText}>0</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.scoreButtonWrapper}
                onPress={() => setGameStartingScore(301)}>
                <Text style={styles.scoreButtonText}>301</Text>
              </TouchableRipple>
            </View>
          </View>
        }
      />
    </FullScreenLayout>
  );
};
