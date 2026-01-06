import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { useAuthContext } from '~/context/AuthContext';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { useStyles } from './styles';
import { UserService } from '~/services/user_service';
import { SwipeActions } from '~/components/Swipeable/SwipeActions';
import { FormInput } from '~/components/FormInput/FormInput';
import { LogoButton } from '~/components/LogoButton/LogoButton';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, UNAUTHENTICATED_SCREEN } from '#/navigation';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { AppModal } from '~/components/AppModal/AppModal';
import { Loader } from '~/components/Loader/Loader';
import { Friend } from '~/models/user';
import { useAppTheme } from '~/App/theming.tsx';

export const FriendsScreen = () => {
  const navigator = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthContext();

  const [working, setWorking] = useState(false);
  const [pendingFriends, setPendingFriends] = useState<Friend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendEmail, setFriendEmail] = useState<string>('');
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<string>();

  const { colors } = useAppTheme();
  const styles = useStyles();

  useEffect(() => {
    if (!user) {
      signOut(getAuth()).finally(() => {
        navigator.popToTop();
        navigator.replace(UNAUTHENTICATED_SCREEN);
      });
    }
  }, [user, navigator]);

  useEffect(() => {
    setPendingFriends(user?.friends?.filter(f => !f.confirmed) ?? []);
    setFriends(user?.friends?.filter(f => f.confirmed) ?? []);
  }, [user]);

  const addFriend = async () => {
    if (!user) return;

    setWorking(true);

    if (!friendEmail.length) {
      setError('Something went wrong, please try it again later');
      setWorking(false);
      return;
    }

    try {
      await UserService.addFriend(user.id, friendEmail);
      setStatus('Friend request has been sent');
    } catch {
      setError('Something went wrong, please try it again later');
    } finally {
      setWorking(false);
    }
  };

  if (!user) {
    return <View />;
  }

  return (
    <FullScreenLayout style={styles.layout}>
      <ScrollView style={styles.content}>
        <FormInput
          style={styles.input}
          label="ADD A FRIEND"
          placeholder="john@doe.com"
          onChangeText={setFriendEmail}
          autoCapitalize="none"
          returnKeyType="next"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <LogoButton label="ADD" onPress={addFriend} style={styles.button} />
        {!!pendingFriends.length && (
          <>
            <View style={styles.header}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.heading}>
                Pending
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.section}>
              {pendingFriends.map((friend, index) => {
                const actions = [];
                if (friend.requester != user?.id) {
                  actions.push({
                    icon: 'check',
                    backgroundColor: 'green',
                    onPress: () => user && UserService.confirmFriend(user.id, friend.user.id),
                  });
                }
                return (
                  <SwipeActions
                    key={index}
                    bounce={true}
                    rightActions={[
                      ...actions,
                      {
                        icon: 'delete',
                        onPress: () =>
                          user &&
                          UserService.removeFriend(user.id, friend.user.id, friend.requester),
                      },
                    ]}
                  >
                    <View style={styles.friendContainer}>
                      <Text style={styles.friendName}>{friend.user.name}</Text>
                    </View>
                  </SwipeActions>
                );
              })}
            </View>
          </>
        )}
        <View style={styles.header}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.heading}>
            Your friends
          </Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.section}>
          {friends.map((friend, index) => (
            <SwipeActions
              key={index}
              bounce={!pendingFriends.length && index == 0}
              rightActions={[
                {
                  icon: 'delete',
                  onPress: () => user && UserService.removeFriend(user.id, friend.user.id),
                },
              ]}
            >
              <View style={styles.friendContainer}>
                <Text style={styles.friendName}>{friend.user.name}</Text>
              </View>
            </SwipeActions>
          ))}
        </View>
      </ScrollView>
      <AppModal
        visible={!!error}
        title="ERROR"
        titleColor={colors.error}
        titleIcon="alert-circle"
        subTitle={error}
        onDismiss={() => {
          setError(undefined);
        }}
      />
      <AppModal
        visible={!!status}
        title="SUCCESS"
        titleColor={colors.success}
        titleIcon="check"
        subTitle={status}
        onDismiss={() => {
          setStatus(undefined);
        }}
      />
      <Loader working={working} />
    </FullScreenLayout>
  );
};
export default FriendsScreen;
