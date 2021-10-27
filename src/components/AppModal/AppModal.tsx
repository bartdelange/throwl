import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Portal,
  Modal,
  Surface,
  useTheme,
  Text,
  IconButton,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { makeStyles } from './styles';

interface AppModalProps {
  visible: boolean;
  title: string;
  titleIcon: string;
  titleColor?: string;
  subTitle?: string;
  onDismiss?: () => void;
}

export const AppModal: React.FC<PropsWithChildren<AppModalProps>> = ({
  visible,
  title,
  titleIcon,
  titleColor,
  subTitle,
  onDismiss,
  children,
}: PropsWithChildren<AppModalProps>) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}>
        <Surface style={styles.surface}>
          <IconButton
            icon="close"
            color={colors.primary}
            style={styles.closeIcon}
            onPress={onDismiss}
          />
          <View style={styles.titleWrapper}>
            <MaterialCommunityIcons
              name={titleIcon}
              style={[styles.icon, titleColor ? { color: titleColor } : {}]}
            />
            <Text
              style={[styles.title, titleColor ? { color: titleColor } : {}]}>
              {title}
            </Text>
          </View>
          <View style={styles.subTitleWrapper}>
            {subTitle && <Text style={styles.subTitle}>{subTitle}</Text>}
          </View>
          {children && <View style={styles.actionsWrapper}>{children}</View>}
        </Surface>
      </Modal>
    </Portal>
  );
};
