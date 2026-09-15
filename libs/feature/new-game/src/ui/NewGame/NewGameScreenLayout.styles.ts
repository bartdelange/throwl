import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

const CONTENT_WIDTH = '80%';
const CONTENT_BOTTOM_SPACING = 16;
const ACTION_TOP_SPACING = 16;
const ACTION_BOTTOM_SPACING = 32;

export const useStyles = (bottomInset: number) =>
  useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          alignItems: 'center',
        },
        content: {
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          width: CONTENT_WIDTH,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          width: '100%',
          paddingBottom: CONTENT_BOTTOM_SPACING,
        },
        action: {
          width: CONTENT_WIDTH,
          alignItems: 'center',
          paddingTop: ACTION_TOP_SPACING,
          paddingBottom: bottomInset + ACTION_BOTTOM_SPACING,
        },
      }),
    [bottomInset],
  );
