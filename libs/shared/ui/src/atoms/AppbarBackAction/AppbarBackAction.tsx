import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { FC } from 'react';
import { Appbar, AppbarActionProps } from 'react-native-paper';

export type AppbarBackActionProps = Omit<
  AppbarActionProps,
  'icon' | 'isLeading'
>;

export const AppbarBackAction: FC<AppbarBackActionProps> = ({
  accessibilityLabel = 'Back',
  ...props
}) => (
  <Appbar.Action
    {...props}
    accessibilityLabel={accessibilityLabel}
    icon={({ color, size }) => (
      <MaterialDesignIcons name="arrow-left" color={color} size={size} />
    )}
    isLeading
  />
);
