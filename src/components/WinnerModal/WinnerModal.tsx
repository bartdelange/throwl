import { useAppTheme } from '~/App/theming.tsx';
import { Dimensions, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useStyles } from '~/components/WinnerModal/WinnerModal.styles.ts';
import { AppModal } from '../AppModal/AppModal';
import { FC } from 'react';

interface WinnerModalProps {
  winnerName: string;
  visible: boolean;
  onUndoPress: () => void;
  onExitPress: () => void;
  onStatsPress: () => void;
}
export const WinnerModal: FC<WinnerModalProps> = ({
  winnerName,
  visible,
  onUndoPress,
  onExitPress,
  onStatsPress,
}) => {
  const { colors } = useAppTheme();
  const { width } = Dimensions.get('window');
  const iconSize = Math.max(width * 0.04, 24);
  const styles = useStyles();

  return (
    <AppModal
      title="WINNER"
      titleIcon="crown"
      subTitle={winnerName}
      visible={visible}
      actions={
        <View style={styles.buttonContainer}>
          <IconButton
            icon="logout-variant"
            size={iconSize * 1.5}
            iconColor={colors.primary}
            onPress={onExitPress}
          />
          <IconButton
            icon="chart-line"
            size={iconSize * 1.5}
            iconColor={colors.success}
            onPress={onStatsPress}
          />
          <IconButton
            icon="restore"
            size={iconSize * 1.5}
            iconColor={colors.error}
            onPress={onUndoPress}
            style={[styles.undoButton, styles.transparent]}
          />
        </View>
      }
    />
  );
};
