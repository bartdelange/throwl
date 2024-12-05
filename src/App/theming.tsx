import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import {
    configureFonts,
    MD3DarkTheme as PaperDarkTheme,
    MD3DarkTheme as PaperMD2DarkTheme,
    useTheme,
} from 'react-native-paper';
import { adaptNavigationTheme } from 'react-native-paper';
import merge from 'deepmerge';

declare global {
    namespace ReactNativePaper {
        interface ThemeColors {
            error: string;
            success: string;
            warning: string;
        }
    }
}

const fonts: {
    [key in 'heavy' | 'bold' | 'regular' | 'medium' | 'light' | 'thin']: {
        fontFamily: string;
        fontWeight:
            | 'normal'
            | 'bold'
            | '100'
            | '200'
            | '300'
            | '400'
            | '500'
            | '600'
            | '700'
            | '800'
            | '900';
    };
} = {
    heavy: {
        fontFamily: 'Karbon-Bold',
        fontWeight: 'normal',
    },
    bold: {
        fontFamily: 'Karbon-Semibold',
        fontWeight: 'normal',
    },
    regular: {
        fontFamily: 'Karbon-Regular',
        fontWeight: 'normal',
    },
    medium: {
        fontFamily: 'Karbon-Medium',
        fontWeight: 'normal',
    },
    light: {
        fontFamily: 'Karbon-Regular',
        fontWeight: 'normal',
    },
    thin: {
        fontFamily: 'Karbon-Regular',
        fontWeight: 'normal',
    },
};
const fontConfig = {
    ios: fonts,
    android: fonts,
    macos: fonts,
    windows: fonts,
    web: fonts,
    native: fonts,
};

const { DarkTheme } = adaptNavigationTheme({
    reactNavigationDark: NavigationDarkTheme,
});

const CombinedDarkTheme = merge(PaperDarkTheme, DarkTheme);

const colors = {
    ...CombinedDarkTheme.colors,

    primary: '#02314e',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(205, 229, 255)',
    onPrimaryContainer: 'rgb(0, 29, 50)',
    secondary: '#adcadb',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(192, 232, 255)',
    onSecondaryContainer: 'rgb(0, 30, 43)',
    tertiary: 'rgb(0, 102, 135)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(192, 232, 255)',
    onTertiaryContainer: 'rgb(0, 30, 43)',
    error: 'rgb(186, 26, 26)',
    onError: 'rgb(255, 255, 255)',
    success: '#008000',
    onSuccess: 'rgb(255, 255, 255)',
    warning: '#c0c000',
    onWarning: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 218, 214)',
    onErrorContainer: 'rgb(65, 0, 2)',
    background: '#02314e',
    onBackground: 'rgb(255, 255, 255)',
    surface: '#02314e',
    onSurface: 'rgb(255, 255, 255)',
    card: 'rgb(0, 99, 153)',
    onCard: 'rgb(255, 255, 255)',
    surfaceVariant: 'rgb(222, 227, 235)',
    onSurfaceVariant: 'rgb(66, 71, 78)',
    outline: 'rgb(114, 120, 126)',
    outlineVariant: 'rgb(194, 199, 207)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(47, 48, 51)',
    inverseOnSurface: 'rgb(240, 240, 244)',
    inversePrimary: 'rgb(148, 204, 255)',
    elevation: {
        level0: 'transparent',
        level1: 'rgb(239, 244, 250)',
        level2: 'rgb(232, 240, 247)',
        level3: 'rgb(224, 235, 244)',
        level4: 'rgb(222, 234, 243)',
        level5: 'rgb(217, 231, 241)',
    },
    surfaceDisabled: 'rgba(26, 28, 30, 0.12)',
    onSurfaceDisabled: 'rgba(26, 28, 30, 0.38)',
    backdrop: 'rgba(43, 49, 55, 0.4)',
};

export const paperTheme = {
    ...CombinedDarkTheme,
    colors,
    fonts: configureFonts({ config: fontConfig as any }),
};

export const navigationTheme = {
    ...PaperMD2DarkTheme,
    ...NavigationDarkTheme,
    colors: {
        ...PaperMD2DarkTheme.colors,
        ...NavigationDarkTheme.colors,
        ...colors,
    },
    fonts,
};

export type AppTheme = typeof paperTheme;
export const useAppTheme = () => useTheme<AppTheme>();
