import React, { FC, ReactNode } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { IconButton, Modal, Portal, Surface, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStyles } from './styles';
import { useAppTheme } from '~/App/theming.tsx';

interface AppModalProps {
  visible: boolean;
  title: string;
  titleIcon?: string;
  titleColor?: string;
  subTitle?: string;
  customContent?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
}

export const AppModal: FC<AppModalProps> = ({
  visible,
  title,
  titleIcon,
  titleColor,
  subTitle,
  customContent,
  onDismiss,
  actions,
}: AppModalProps) => {
  const { colors } = useAppTheme();
  const styles = useStyles();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Surface style={styles.surface}>
          <View style={styles.titleWrapper}>
            {titleIcon && (
              <MaterialCommunityIcons
                name={titleIcon}
                numberOfLines={1}
                allowFontScaling={false}
                adjustsFontSizeToFit={true}
                style={[styles.icon, titleColor ? { color: titleColor } : {}]}
              />
            )}
            <Text
              numberOfLines={1}
              allowFontScaling={false}
              adjustsFontSizeToFit={true}
              style={[styles.title, titleColor ? { color: titleColor } : {}]}
            >
              {title}
            </Text>
          </View>
          {subTitle && (
            <View style={styles.subTitleWrapper}>
              <Text style={styles.subTitle}>{subTitle}</Text>
            </View>
          )}
          <ScrollView
            alwaysBounceVertical={false}
            nestedScrollEnabled
            style={{
              maxHeight: Dimensions.get('window').height * 0.5,
              paddingHorizontal: 10,
            }}
          >
            {customContent && <View style={styles.customContentWrapper}>{customContent}</View>}
          </ScrollView>
          {actions && <View style={styles.actionsWrapper}>{actions}</View>}
          {onDismiss && (
            <IconButton
              icon="close"
              iconColor={colors.primary}
              style={styles.closeIcon}
              onPress={onDismiss}
            />
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};
