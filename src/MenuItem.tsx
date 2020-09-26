import React, {memo, PropsWithChildren} from 'react';

import {
  Platform,
  StyleSheet,
  Text, TextStyle,
  TouchableHighlight, TouchableHighlightProps,
  TouchableNativeFeedback, TouchableNativeFeedbackProps,
  View,
} from 'react-native';

const Touchable = Platform.select({
  android: TouchableNativeFeedback,
  // @ts-ignore
  default: TouchableHighlight
});

export type MenuItemProps = PropsWithChildren<{
  disabled?: boolean,
  disabledTextColor?: string,
  ellipsizeMode?: 'clip' | 'tail',
  textStyle?: TextStyle
}> & (TouchableHighlightProps | TouchableNativeFeedbackProps);
const MenuItem = memo(function MenuItem({
                    children,
                    disabled = false,
                    disabledTextColor = '#bdbdbd',
                    ellipsizeMode = Platform.OS === 'ios' ? 'clip' : 'tail',
                    onPress,
                    style,
                    textStyle,
                    ...props
                  }: MenuItemProps) {
  const touchableProps =
    Platform.OS === 'android'
      ? { background: TouchableNativeFeedback.SelectableBackground() }
      : {};

  return (
    <Touchable
      disabled={disabled}
      onPress={onPress}
      {...touchableProps}
      {...props}
    >
      <View style={[styles.container, style]}>
        <Text
          ellipsizeMode={ellipsizeMode}
          numberOfLines={1}
          style={[
            styles.title,
            disabled && { color: disabledTextColor },
            textStyle,
          ]}
        >
          {children}
        </Text>
      </View>
    </Touchable>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 48,
    justifyContent: 'center',
    maxWidth: 248,
    minWidth: 124,
  },
  title: {
    fontSize: 14,
    fontWeight: '400',
    paddingHorizontal: 16,
    textAlign: 'left',
  },
});

export default MenuItem;
