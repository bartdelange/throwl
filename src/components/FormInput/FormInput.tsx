import React from 'react';
import { StyleProp, TextInput, TextInputProps, View } from 'react-native';
import { Text } from 'react-native-paper';
import { makeStyles } from './styles';

interface FormInputProps extends TextInputProps {
    style?: StyleProp<any>;
    label: string;
    labelColor?: string;
    value?: string;
    placeholder?: string;
}

export const FormInput = React.forwardRef<TextInput, FormInputProps>(
    ({ style, label, labelColor, value, placeholder, ...rest }, ref) => {
        const styles = makeStyles(labelColor);
        return (
            <View style={[styles.wrapper, style]}>
                {label && <Text style={styles.text}>{label}</Text>}
                <TextInput
                    {...rest}
                    defaultValue={value}
                    style={styles.input}
                    numberOfLines={1}
                    placeholder={placeholder}
                    placeholderTextColor="#AFAFAF"
                    ref={ref}
                />
            </View>
        );
    }
);
