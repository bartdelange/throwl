import React from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import {
  IconButton,
  Modal,
  Portal,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { makeStyles } from './styles';

interface AppModalProps {
  visible: boolean;
  title: string;
  titleIcon?: string;
  titleColor?: string;
  subTitle?: string;
  customContent?: React.ReactNode;
  actions?: React.ReactNode;
  onDismiss?: () => void;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  title,
  titleIcon,
  titleColor,
  subTitle,
  customContent,
  onDismiss,
  actions,
}: AppModalProps) => {
  const { colors } = useTheme();
  const styles = makeStyles();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}>
        <Surface style={styles.surface}>
          <View style={styles.titleWrapper}>
            {titleIcon && (
              <MaterialCommunityIcons
                name={titleIcon}
                style={[styles.icon, titleColor ? { color: titleColor } : {}]}
              />
            )}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.title, titleColor ? { color: titleColor } : {}]}>
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
            }}>
            {customContent && (
              <View style={styles.customContentWrapper}>{customContent}</View>
            )}
          </ScrollView>
          {actions && <View style={styles.actionsWrapper}>{actions}</View>}
          {onDismiss && (
            <IconButton
              icon="close"
              color={colors.primary}
              style={styles.closeIcon}
              onPress={onDismiss}
            />
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};
