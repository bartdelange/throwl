import React from 'react';
import { FlatList, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { AuthContext } from '~/context/AuthContext';
import { FullScreenLayout } from '~/layouts/FullScreen/FullScreen';
import { makeStyles } from './styles';
import { UserService } from '~/services/user_service';
import { SwipeActions } from '~/components/Swipeable/SwipeActions';

export const FriendsScreen = () => {
  const { user } = React.useContext(AuthContext);
  const styles = makeStyles();

  return (
    <FullScreenLayout style={styles.layout}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.heading}>
            Your friends
          </Text>
        </View>
        <Divider style={styles.divider} />
        <FlatList
          scrollEnabled={false}
          data={user?.friends || []}
          renderItem={({ item: friend, index }) => (
            <SwipeActions
              key={index}
              bounce={index == 0}
              rightActions={[
                {
                  icon: 'delete',
                  onPress: () =>
                    user && UserService.removeFriend(user.id, friend.user.id),
                },
              ]}>
              <View style={styles.friendContainer}>
                <Text style={styles.friendName}>{friend.user.name}</Text>
              </View>
            </SwipeActions>
          )}
          style={styles.section}
        />
      </View>
    </FullScreenLayout>
  );
};
