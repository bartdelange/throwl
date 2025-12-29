import {
    GAME_DETAIL_SCREEN,
    HOME_SCREEN,
    PLAYED_GAMES_SCREEN,
    RootStackParamList,
} from '#/navigation';
import { useNavigation, useRoute } from '@react-navigation/core';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { Dimensions, FlatList, Pressable, View } from 'react-native';
import Confetti from 'react-native-confetti';
import { Appbar, IconButton, Text } from 'react-native-paper';
import {
    SafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
    activateKeepAwake,
    deactivateKeepAwake,
} from '@sayem314/react-native-keep-awake';
import Tts from 'react-native-tts';
import { useAppTheme } from '~/App/theming.tsx';

import { AppModal } from '~/components/AppModal/AppModal';
import { ClickableDartboard } from '~/components/ClickableDartboard/ClickableDartboard';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { ScoreHelper } from '~/lib/score_helper';
import { DartboardScoreType, Throw } from '~/models/throw';
import { Turn } from '~/models/turn';
import { GameService } from '~/services/game_service';
import { makeStyles } from './styles';
import { DartFinishers } from '#/dart-finishers.ts';
import { TurnIndicatorBar } from '~/screens/PlayGame/components/TurnIndicatorBar/TurnIndicatorBar.tsx';
import { ScoreTable } from '~/screens/PlayGame/components/ScoreTable/ScoreTable.tsx';

export const PlayGameScreen: React.FC<any> = () => {
    const navigator =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'PLAY_GAME'>>();

    const [gameId, setGameId] = React.useState<string>();
    const [gameFinished, setGameFinished] = React.useState<boolean>(false);
    const [gameFinishedPopup, setGameFinishedPopup] =
        React.useState<boolean>(false);
    const [droppingOutUserIndex, setDroppingOutUserIndex] =
        React.useState<number>();
    const [activeUserIndex, setActiveUserIndex] = React.useState<number>(0);
    const [turns, setTurns] = React.useState<Turn[]>([]);
    const [currentTurn, setCurrentTurn] = React.useState<Turn>({
        userId: GameService.stubPlayer(route.params.players[0]).id,
        throws: [],
    });
    const [turnNeeded, setTurnNeeded] = React.useState<
        [Throw | undefined, Throw | undefined, Throw | undefined]
    >([undefined, undefined, undefined]);
    const { colors } = useAppTheme();
    const { width } = Dimensions.get('window');
    const insets = useSafeAreaInsets();
    const styles = makeStyles();
    const iconSize = Math.max(width * 0.04, 24);
    const scoreTableRef = React.createRef<FlatList>();

    const confettiRef = React.createRef<Confetti>();
    const [confettiing, setConfettiing] = React.useState(false);

    // Required by tts app, results in errors when not listening to these events
    useEffect(() => {
        Tts.addEventListener('tts-start', _event => {});
        Tts.addEventListener('tts-finish', _event => {});
        Tts.addEventListener('tts-cancel', _event => {});
    });

    // Wake lock
    useEffect(() => {
        activateKeepAwake();
        return () => {
            deactivateKeepAwake();
        };
    });

    // Game resumption
    useEffect(() => {
        if (route.params.activeGame) {
            const activeGame = route.params.activeGame;
            setGameId(activeGame.id);
            setTurns(activeGame.turns);
            let nextUserIndex = 0;
            if (activeGame.turns[activeGame.turns.length - 1]) {
                nextUserIndex = rotateUsers(
                    false,
                    route.params.players.findIndex(player => {
                        return (
                            GameService.stubPlayer(player).id ===
                            activeGame.turns[activeGame.turns.length - 1]
                                ?.userId
                        );
                    })
                );
            }
            setCurrentTurn({
                userId: GameService.stubPlayer(
                    route.params.players[nextUserIndex]
                ).id,
                throws: [],
            });
        }
    }, []);

    const rotateUsers = (
        reverse: boolean = false,
        customIndex?: number
    ): number => {
        let nextUserIndex =
            customIndex !== undefined && customIndex !== null
                ? customIndex + (reverse ? -1 : 1)
                : activeUserIndex + (reverse ? -1 : 1);
        if (nextUserIndex >= route.params.players.length) nextUserIndex = 0;
        if (nextUserIndex < 0) nextUserIndex = route.params.players.length - 1;
        scoreTableRef.current?.scrollToIndex({
            animated: true,
            viewPosition: 0.5,
            index: nextUserIndex,
        });
        setActiveUserIndex(nextUserIndex);
        return nextUserIndex;
    };

    const speak = async (words: string) => {
        try {
            await Tts.setDefaultLanguage('en-US');
            // @ts-ignore Options fields are optional as far as the documentation is concerned
            Tts.speak(words, {
                rate: 0.45,
            });
        } catch (err) {
            console.error(`speaking error `, err);
        }
    };

    const calculateThrowsNeeded = (
        userScoreLeft: number,
        userThrows: Throw[]
    ) => {
        const finishers = DartFinishers[userScoreLeft];

        if (finishers && finishers.length <= 3 - userThrows.length) {
            const updatedTurns = Array(3).fill(undefined) as [
                Throw | undefined,
                Throw | undefined,
                Throw | undefined,
            ];
            for (let i = userThrows.length; i < 3; i++) {
                updatedTurns[i] = finishers[i - userThrows.length];
            }
            setTurnNeeded(updatedTurns);
        } else {
            setTurnNeeded([undefined, undefined, undefined]);
        }
    };

    const finishTurn = async (turn: Turn) => {
        const newTurns = [...turns, turn];
        setTurns(newTurns);
        const nextUserIndex = rotateUsers();
        const nextUser = GameService.stubPlayer(
            route.params.players[nextUserIndex]
        );
        setCurrentTurn({
            userId: nextUser.id,
            throws: [],
        });

        const userScoreLeft =
            route.params.startingScore -
            ScoreHelper.calculateScore(
                newTurns.filter(t => t.userId === nextUser.id && t.isValid)
            );

        calculateThrowsNeeded(userScoreLeft, []);
        if (userScoreLeft <= 170) {
            await speak(
                `${nextUser.name.split(' ')[0]} you need ${userScoreLeft}`
            );
        }
        await persist(newTurns);
    };

    const finishGame = async (turn: Turn) => {
        setConfettiing(true);
        const newTurns = [...turns, turn];
        const winningUser = GameService.stubPlayer(
            route.params.players[activeUserIndex]
        );
        setGameFinished(true);
        setGameFinishedPopup(true);
        speak(`${winningUser.name.split(' ')[0]} has won!`);
        await persist(newTurns, true);
    };

    const onThrow = (thrw: Throw, _position: { x: number; y: number }) => {
        if (gameFinished) return;
        const thisTurn = {
            ...currentTurn,
            throws: [...currentTurn.throws, thrw],
        };
        const turnScore = ScoreHelper.calculateTurnScore(thisTurn);
        const userScore =
            ScoreHelper.calculateScore(
                turns.filter(t => t.userId === thisTurn.userId && t.isValid)
            ) + turnScore;
        thisTurn.isValid = ScoreHelper.checkThrowValidity(
            thisTurn,
            userScore,
            route.params.startingScore
        );

        setCurrentTurn(thisTurn);

        const userScoreLeft = route.params.startingScore - userScore;
        calculateThrowsNeeded(userScoreLeft, thisTurn.throws);

        if (userScore === route.params.startingScore && thisTurn.isValid) {
            return finishGame(thisTurn);
        }
        if (thisTurn.throws.length === 3 || !thisTurn.isValid) {
            if (!thisTurn.isValid) {
                speak('No score');
            } else if (turnScore === 69) {
                speak('sheeeeesh');
            } else {
                speak(turnScore.toFixed(0));
            }

            return finishTurn(thisTurn);
        }
    };

    const undoThrow = () => {
        setConfettiing(false);
        let newTurn = { ...currentTurn };
        let newTurns = [...turns];
        if (!newTurn.throws.length) {
            const lastTurn = newTurns.pop();
            if (!lastTurn) return;
            newTurn = { ...lastTurn, throws: [...lastTurn.throws] };
            setTurns(newTurns);
            rotateUsers(true);
        }

        newTurn.throws.pop();

        const turnScore = ScoreHelper.calculateTurnScore(newTurn);
        const userScore =
            ScoreHelper.calculateScore(
                turns.filter(t => t.userId === newTurn.userId && t.isValid)
            ) + turnScore;
        const userScoreLeft = route.params.startingScore - userScore;
        calculateThrowsNeeded(userScoreLeft, newTurn.throws);

        setCurrentTurn(newTurn);
        setGameFinishedPopup(false);
        setGameFinished(false);
        return persist(newTurns, false);
    };

    const dropOutUser = (userId: string) => {
        if (route.params.players.length === 1) {
            // Remove game
            return navigator.popToTop();
        }
        const oldUserIndex = route.params.players.findIndex(
            u => GameService.stubPlayer(u).id === userId
        );
        const newUserIndex =
            oldUserIndex === route.params.players.length - 1 ? 0 : oldUserIndex;
        const newTurns = turns.filter(t => t.userId !== userId);
        const newPlayers = route.params.players.filter(
            u => GameService.stubPlayer(u).id !== userId
        );
        const newNextPlayer = GameService.stubPlayer(newPlayers[newUserIndex]);
        setTurns(newTurns);
        navigator.setParams({
            ...route.params,
            players: newPlayers,
        });
        setActiveUserIndex(newUserIndex);
        if (oldUserIndex === activeUserIndex) {
            setCurrentTurn({
                userId: newNextPlayer.id,
                throws: [],
            });
        }

        const userScoreLeft =
            route.params.startingScore -
            ScoreHelper.calculateScore(
                turns.filter(t => t.userId === newNextPlayer.id && t.isValid)
            );

        calculateThrowsNeeded(userScoreLeft, []);
        if (userScoreLeft <= 170) {
            speak(
                `${
                    newPlayers[newUserIndex].name.split(' ')[0]
                } you need ${userScoreLeft}`
            );
        }

        setDroppingOutUserIndex(undefined);
        return persist(newTurns, true);
    };

    const persist = async (turns: Turn[], finished: boolean = false) => {
        if (!gameId) {
            const savedGamed = await GameService.create(
                route.params.players,
                turns,
                new Date(),
                route.params.startingScore
            );
            setGameId(savedGamed.id);
        } else {
            await GameService.update(
                gameId,
                route.params.players,
                turns,
                route.params.startingScore,
                finished ? new Date() : undefined
            );
        }
    };

    React.useEffect(() => {
        confettiing
            ? confettiRef.current?.startConfetti()
            : confettiRef.current?.stopConfetti();
    }, [confettiing]);

    return (
        <FullScreenLayout style={styles.layout} mode="light" size="fullscreen">
            <View style={styles.content}>
                <Pressable
                    onPress={evt =>
                        onThrow(
                            {
                                type: DartboardScoreType.Out,
                                score: 0,
                            },
                            {
                                x: evt.nativeEvent.pageX,
                                y: evt.nativeEvent.pageY,
                            }
                        )
                    }
                >
                    <View style={styles.dartboardWrapper}>
                        <Text style={styles.missText}>MISS</Text>
                        <ClickableDartboard onClick={onThrow} />
                    </View>
                </Pressable>
                <SafeAreaView style={styles.scoreWrapper}>
                    <TurnIndicatorBar
                        currentTurn={currentTurn}
                        turnNeeded={turnNeeded}
                        iconSize={iconSize}
                        undoThrow={undoThrow}
                    />
                    <ScoreTable
                        turns={turns}
                        activeUserIndex={activeUserIndex}
                        scoreTableRef={scoreTableRef}
                        players={route.params.players}
                        startingScore={route.params.startingScore}
                        currentTurn={currentTurn}
                        width={width}
                        setDroppingOutUserIndex={setDroppingOutUserIndex}
                    />
                </SafeAreaView>
            </View>
            <Confetti timeout={5} size={2} ref={confettiRef} untilStopped />
            <AppModal
                title="WINNER"
                titleIcon="crown"
                subTitle={
                    GameService.stubPlayer(
                        route.params.players[activeUserIndex]
                    ).name
                }
                visible={gameFinishedPopup}
                onDismiss={() => {
                    setGameFinishedPopup(false);
                    navigator.popToTop();
                }}
                actions={
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                        }}
                    >
                        <IconButton
                            icon="logout-variant"
                            size={iconSize * 1.5}
                            iconColor={colors.primary}
                            onPress={() => {
                                setGameFinishedPopup(false);
                                navigator.popToTop();
                            }}
                        />
                        <IconButton
                            icon="chart-line"
                            size={iconSize * 1.5}
                            iconColor={colors.success}
                            onPress={async () => {
                                setGameFinishedPopup(false);
                                navigator.reset({
                                    index: 0,
                                    routes: [
                                        { name: HOME_SCREEN },
                                        { name: PLAYED_GAMES_SCREEN },
                                        {
                                            name: GAME_DETAIL_SCREEN,
                                            params: {
                                                game: await GameService.getById(
                                                    gameId!
                                                ),
                                            },
                                        },
                                    ],
                                });
                            }}
                        />
                        <IconButton
                            icon="restore"
                            size={iconSize * 1.5}
                            iconColor={colors.error}
                            onPress={undoThrow}
                            style={[
                                styles.undoButton,
                                {
                                    backgroundColor: 'transparent',
                                },
                            ]}
                        />
                    </View>
                }
            />
            <AppModal
                title="ARE YOU SURE?"
                titleColor={colors.primary}
                subTitle={`Are you sure you wish to drop out${
                    droppingOutUserIndex != null
                        ? ` ${
                              GameService.stubPlayer(
                                  route.params.players[droppingOutUserIndex]
                              ).name.split(' ')[0]
                          }`
                        : ''
                }?`}
                visible={droppingOutUserIndex != null}
                actions={
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                        }}
                    >
                        <IconButton
                            icon="check"
                            size={iconSize * 1.5}
                            iconColor={colors.success}
                            onPress={() =>
                                droppingOutUserIndex != null
                                    ? dropOutUser(
                                          GameService.stubPlayer(
                                              route.params.players[
                                                  droppingOutUserIndex
                                              ]
                                          ).id
                                      )
                                    : null
                            }
                        />
                        <IconButton
                            icon="close"
                            size={iconSize * 1.5}
                            iconColor={colors.error}
                            onPress={() => setDroppingOutUserIndex(undefined)}
                        />
                    </View>
                }
            />
            <View style={[styles.backButton, { top: insets.top }]}>
                <Appbar.BackAction
                    color={colors.primary}
                    onPress={navigator.goBack}
                />
            </View>
        </FullScreenLayout>
    );
};
