import { useAppTheme } from '@throwl/shared-theme';
import { Dimensions, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useStyles } from './WinnerModal.styles';
import { AppModal } from '../../molecules/AppModal/AppModal';
import { FC, ReactNode } from 'react';

interface WinnerModalProps {
  winnerName: string;
  visible: boolean;
  saveFeedback?: ReactNode;
  statsDisabled?: boolean;
  onUndoPress?: () => void;
  onExitPress: () => void;
  onStatsPress: () => void;
}
export const WinnerModal: FC<WinnerModalProps> = ({
  winnerName,
  visible,
  saveFeedback,
  statsDisabled,
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
      customContent={saveFeedback}
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
            disabled={statsDisabled}
            onPress={onStatsPress}
          />
          <IconButton
            icon="restore"
            size={iconSize * 1.5}
            iconColor={colors.error}
            disabled={!onUndoPress}
            onPress={onUndoPress}
            style={[styles.undoButton, styles.transparent]}
          />
        </View>
      }
    />
  );
};
