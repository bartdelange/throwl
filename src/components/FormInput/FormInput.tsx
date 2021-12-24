import React from 'react';
import { StyleProp, TextInput, TextInputProps, View } from 'react-native';
import { Text } from 'react-native-paper';
import { makeStyles } from './styles';

interface FormInputProps extends TextInputProps {
  style?: StyleProp<any>;
  label: string;
  value: string;
  placeholder?: string;
}

export const FormInput = React.forwardRef<TextInput, FormInputProps>(
  ({ style, label, value, placeholder, ...rest }, ref) => {
    const styles = makeStyles();
    return (
      <View style={[styles.wrapper, style]}>
        <Text style={styles.text}>{label}</Text>
        <TextInput
          {...rest}
          value={value}
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
