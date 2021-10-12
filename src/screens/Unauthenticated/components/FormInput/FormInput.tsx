import React from 'react';
import { StyleSheet, View, TextInput } from 'react-native';

interface FormInputProps extends TextInput {
  label: string;
  value: string;
  placeholder: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  placeholder,
  ...rest
}) => {
  return (
    <View>
      <TextInput
        {...rest}
        value={value}
        style={styles.input}
        numberOfLines={1}
        placeholder={placeholder}
        placeholderTextColor="#"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
});
