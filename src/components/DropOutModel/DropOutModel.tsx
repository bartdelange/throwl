import { AppModal } from '~/components/AppModal/AppModal.tsx';
import { Dimensions, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAppTheme } from '~/App/theming.tsx';
import { FC } from 'react';

interface DropOutModelProps {
  dropOutUser: () => void;
  cancel: () => void;
  playerName: string;
  visible: boolean;
}
export const DropOutModel: FC<DropOutModelProps> = ({
  dropOutUser,
  cancel,
  playerName,
  visible,
}) => {
  const { colors } = useAppTheme();
  const { width } = Dimensions.get('window');
  const iconSize = Math.max(width * 0.04, 24);

  return (
    <AppModal
      title="ARE YOU SURE?"
      titleColor={colors.primary}
      subTitle={`Are you sure you wish to drop out ${playerName}?`}
      visible={visible}
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
            onPress={dropOutUser}
          />
          <IconButton
            icon="close"
            size={iconSize * 1.5}
            iconColor={colors.error}
            onPress={() => cancel}
          />
        </View>
      }
    />
  );
};
