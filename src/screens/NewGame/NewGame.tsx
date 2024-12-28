import { RouteProp, useNavigation } from '@react-navigation/core';
import { useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import {
    Dimensions,
    FlatList,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Col, Row } from 'react-native-easy-grid';
import {
    Divider,
    IconButton,
    List,
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
import { GuestUser, User } from '~/models/user';
import { PlayerItem } from './components/PlayerItem/PlayerItem';
import { makeStyles } from './styles';
import { useAppTheme } from '~/App/theming.tsx';
import { GameService } from '~/services/game_service.ts';
import { FormInput } from '~/components/FormInput/FormInput.tsx';

export const NewGameScreen: React.FC = () => {
    const navigator =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'NEW_GAME'>>();
    const { user } = React.useContext(AuthContext);
    const [selectedUsers, _setSelectedUsers] = React.useState<string[]>(
        route.params?.selectedUsers || []
    );
    const [guestUsers, setGuestUsers] = React.useState<string[]>(
        route.params?.guestUsers || []
    );
    const [customGameScoreOpen, setCustomGameScoreOpen] = React.useState(false);
    const [addGuestOpen, setAddGuestOpen] = React.useState(false);
    const [guestName, setGuestName] = React.useState<string>('');
    const [gameStartingScore, setGameStartingScore] = React.useState(501);
    const { colors } = useAppTheme();
    const menuItemTheme = React.useMemo(
        () => ({ colors: { onSurface: colors.onSurfaceVariant } }),
        [colors]
    );

    const setSelectedUsers = useCallback(
        (selectedUsers: string[] | ((current: string[]) => string[])) => {
            if (Array.isArray(selectedUsers)) {
                _setSelectedUsers(selectedUsers);
            } else {
                _setSelectedUsers(current => {
                    return selectedUsers(current);
                });
            }
            1;
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
        setVisible(false);
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

    const addGuest = React.useCallback(() => {
        if (guestName) {
            setGuestUsers(current => {
                return [...current, guestName];
            });
            setGuestName('');
            setAddGuestOpen(false);
        }
    }, [setGuestUsers, setGuestName, guestName]);

    const players = React.useMemo<(Omit<User, 'friends'> | GuestUser)[]>(
        () => [
            { ...user, type: 'user', friends: undefined },
            ...(user.friends || []).map<User>(friend => ({
                ...friend.user,
                type: 'user',
            })),
            ...guestUsers.map<GuestUser>(guestUser => ({
                type: 'guest_user',
                name: guestUser,
            })),
        ],
        [user, guestUsers]
    );

    return (
        <FullScreenLayout style={styles.layout}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={styles.heading}>
                        The Players
                    </Text>
                    <Menu
                        visible={visible}
                        onDismiss={closeMenu}
                        anchor={
                            <TouchableOpacity
                                onPress={openMenu}
                                style={styles.menuButton}>
                                <MaterialCommunityIcons
                                    name="menu"
                                    color="white"
                                    size={Math.max(
                                        50,
                                        Dimensions.get('window').width * 0.1
                                    )}
                                />
                            </TouchableOpacity>
                        }>
                        <Menu.Item
                            leadingIcon="dice-multiple"
                            onPress={randomizeSelected}
                            title="RANDOMIZE PLAYERS"
                            theme={menuItemTheme}
                        />
                        <Menu.Item
                            leadingIcon="account-multiple"
                            onPress={() => {
                                setVisible(false);
                                setSelectedUsers([]);
                                setGuestUsers([]);
                            }}
                            title="CLEAR"
                            theme={menuItemTheme}
                        />
                        <Menu.Item
                            leadingIcon="scoreboard-outline"
                            onPress={() => {
                                setVisible(false);
                                setCustomGameScoreOpen(true);
                            }}
                            title="SET STARTING SCORE"
                            theme={menuItemTheme}
                        />
                        <Menu.Item
                            leadingIcon="account-edit"
                            onPress={() => {
                                setVisible(false);
                                setAddGuestOpen(true);
                            }}
                            title="ADD A GUEST"
                            theme={menuItemTheme}
                        />
                    </Menu>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.playerList}>
                    <FlatList<Omit<User, 'friends'> | GuestUser>
                        data={players}
                        keyExtractor={player =>
                            GameService.stubPlayer(player).id
                        }
                        ListEmptyComponent={
                            <Text style={styles.header}>
                                You have not added any friends yet, you can also
                                add a guest using the menu above
                            </Text>
                        }
                        renderItem={({ item: player }) => {
                            const subbedPlayer = GameService.stubPlayer(player);
                            return (
                                <View style={styles.player}>
                                    <PlayerItem
                                        player={subbedPlayer}
                                        selected={selectedUsers.includes(
                                            subbedPlayer.id
                                        )}
                                        position={
                                            selectedUsers.indexOf(
                                                subbedPlayer.id
                                            ) + 1
                                        }
                                        onPress={() =>
                                            setSelectedUsers(current => {
                                                if (
                                                    current.indexOf(
                                                        subbedPlayer.id
                                                    ) >= 0
                                                ) {
                                                    return current.filter(
                                                        userId =>
                                                            userId !==
                                                            subbedPlayer.id
                                                    );
                                                } else {
                                                    return [
                                                        ...current,
                                                        subbedPlayer.id,
                                                    ];
                                                }
                                            })
                                        }
                                    />
                                </View>
                            );
                        }}
                    />
                </View>
            </View>
            <View style={styles.goButton}>
                <LogoButton
                    label="GO"
                    size={Math.max(50, Dimensions.get('window').width * 0.1)}
                    disabled={!selectedUsers.length}
                    onPress={() => {
                        navigator.setParams({ selectedUsers, guestUsers });
                        navigator.push(PLAY_GAME_SCREEN, {
                            players: [
                                ...(selectedUsers
                                    .map<
                                        | Omit<User, 'friends'>
                                        | GuestUser
                                        | undefined
                                    >(selectedUser => players.find(p => GameService.stubPlayer(p).id == selectedUser))
                                    .filter(Boolean) as (
                                    | Omit<User, 'friends'>
                                    | GuestUser
                                )[]),
                            ],
                            startingScore: gameStartingScore,
                        });
                    }}
                />
            </View>
            <AppModal
                visible={addGuestOpen}
                titleIcon="account-edit"
                title="ADD A GUEST"
                onDismiss={() => setAddGuestOpen(false)}
                actions={
                    <View>
                        <FormInput
                            style={styles.input}
                            label=""
                            placeholder="John Doe"
                            onChangeText={setGuestName}
                        />
                        <LogoButton
                            mode="light"
                            label="ADD"
                            onPress={addGuest}
                            style={styles.button}
                        />
                    </View>
                }
            />
            <AppModal
                visible={customGameScoreOpen}
                titleIcon="scoreboard-outline"
                title="STARTING SCORE"
                onDismiss={() => setCustomGameScoreOpen(false)}
                actions={
                    <View>
                        <View style={styles.scoreInput}>
                            <Row>
                                <Col size={2}>
                                    <View style={styles.scoreButton}>
                                        <Text style={styles.scoreButtonText}>
                                            {gameStartingScore}
                                        </Text>
                                    </View>
                                </Col>
                                <Col size={1}>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current =>
                                                    +`${current}`.slice(0, -1)
                                            )
                                        }>
                                        <MaterialCommunityIcons
                                            style={styles.scoreRemoveButton}
                                            name="backspace-outline"
                                        />
                                    </TouchableRipple>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current => +`${current}1`
                                            )
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            1
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current => +`${current}2`
                                            )
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            2
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current => +`${current}3`
                                            )
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            3
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current => +`${current}4`
                                            )
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            4
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current => +`${current}5`
                                            )
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            5
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current => +`${current}6`
                                            )
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            6
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current => +`${current}7`
                                            )
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            7
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current => +`${current}8`
                                            )
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            8
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(
                                                current => +`${current}9`
                                            )
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            9
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(501)
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            501
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() => setGameStartingScore(0)}>
                                        <Text style={styles.scoreButtonText}>
                                            0
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setGameStartingScore(301)
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            301
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    <TouchableRipple
                                        style={styles.scoreButton}
                                        onPress={() =>
                                            setCustomGameScoreOpen(false)
                                        }>
                                        <Text style={styles.scoreButtonText}>
                                            Accept
                                        </Text>
                                    </TouchableRipple>
                                </Col>
                            </Row>
                        </View>
                    </View>
                }
            />
        </FullScreenLayout>
    );
};
