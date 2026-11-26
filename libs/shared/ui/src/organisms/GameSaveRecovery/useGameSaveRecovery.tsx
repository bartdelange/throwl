import { useNavigation, usePreventRemove } from '@react-navigation/core';
import { Alert, Pressable } from 'react-native';
import { Text } from 'react-native-paper';

export function useGameSaveRecovery(
  status: 'idle' | 'saving' | 'failed' | 'conflict',
  retry: () => Promise<void>,
) {
  const navigation = useNavigation();
  const gameplayBlocked = status === 'conflict';

  usePreventRemove(status !== 'idle', ({ data }) => {
    const saving = status === 'saving';
    const message = saving
      ? 'The last visit is still saving. Leaving now may lose unsaved changes.'
      : gameplayBlocked
        ? 'A newer game was saved elsewhere. Leave and have a participant reopen it from Played Games.'
        : 'You can stay and retry the save.';
    Alert.alert(saving ? 'Saving game' : 'Unsaved game changes', message, [
      { text: 'Stay', style: 'cancel' },
      {
        text: saving ? 'Leave while saving' : 'Discard unsaved changes',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  let saveFeedback = null;
  if (status === 'failed') {
    saveFeedback = (
      <Pressable accessibilityRole="button" onPress={() => void retry()}>
        <Text>Game save failed. Tap to retry.</Text>
      </Pressable>
    );
  } else if (gameplayBlocked) {
    saveFeedback = (
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
        <Text>
          A newer game was saved elsewhere. Reopen it from a participant’s
          Played Games.
        </Text>
      </Pressable>
    );
  } else if (status === 'saving') {
    saveFeedback = <Text>Saving game…</Text>;
  }

  return { gameplayBlocked, saveFeedback };
}
