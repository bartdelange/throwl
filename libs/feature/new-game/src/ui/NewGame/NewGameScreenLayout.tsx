import { FC, PropsWithChildren, ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullScreenLayout } from '@throwl/shared-layouts';
import { useStyles } from './NewGameScreenLayout.styles';

interface NewGameScreenLayoutProps {
  action: ReactNode;
  scrollable?: boolean;
}

export const NewGameScreenLayout: FC<
  PropsWithChildren<NewGameScreenLayoutProps>
> = ({ action, children, scrollable = true }) => {
  const { bottom } = useSafeAreaInsets();
  const styles = useStyles(bottom);

  return (
    <FullScreenLayout size="fullscreen">
      <View style={styles.screen}>
        {scrollable ? (
          <View style={styles.content}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.content}>{children}</View>
        )}
        <View style={styles.action}>{action}</View>
      </View>
    </FullScreenLayout>
  );
};
