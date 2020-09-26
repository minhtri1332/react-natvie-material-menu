import React, {forwardRef, memo, PropsWithChildren, ReactElement, Ref} from 'react';

import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    I18nManager,
    ViewProps,
    LayoutChangeEvent,
} from 'react-native';

const STATES = {
    HIDDEN: 'HIDDEN',
    ANIMATING: 'ANIMATING',
    SHOWN: 'SHOWN',
};

const EASING = Easing.bezier(0.4, 0, 0.2, 1);

type Props = PropsWithChildren<{
    animationDuration?: number,
    button: ReactElement,
    onHidden?: () => any,
    screenIndent?: number,
    parentStyle?: ViewProps['style']
}> & ViewProps;

class MenuContent extends React.Component<Props & {
    screenIndent: number
}> {
    _container: View | null = null;

    state = {
        menuState: STATES.HIDDEN,

        top: 0,
        left: 0,

        menuWidth: 0,
        menuHeight: 0,

        buttonWidth: 0,
        buttonHeight: 0,

        menuSizeAnimation: new Animated.ValueXY({ x: 0, y: 0 }),
        opacityAnimation: new Animated.Value(0),
    };

    _setContainerRef = (ref: View) => {
        this._container = ref;
    };

    // Start menu animation
    _onMenuLayout = (e: LayoutChangeEvent) => {
        if (this.state.menuState === STATES.ANIMATING) {
            return;
        }

        const { width, height } = e.nativeEvent.layout;

        this.setState(
            {
                menuState: STATES.ANIMATING,
                menuWidth: width,
                menuHeight: height,
            },
            () => {
                Animated.parallel([
                    Animated.timing(this.state.menuSizeAnimation, {
                        toValue: { x: width, y: height },
                        duration: this.props.animationDuration,
                        easing: EASING,
                        useNativeDriver: true
                    }),
                    Animated.timing(this.state.opacityAnimation, {
                        toValue: 1,
                        duration: this.props.animationDuration,
                        easing: EASING,
                        useNativeDriver: true
                    }),
                ]).start();
            },
        );
    };

    _onDismiss = () => {
        if (this.props.onHidden) {
            this.props.onHidden();
        }
    };

    show = () => {
        this._container && this._container.measureInWindow((left, top, buttonWidth, buttonHeight) => {
            this.setState({
                buttonHeight,
                buttonWidth,
                left,
                menuState: STATES.SHOWN,
                top,
            });
        });
    };

    hide = (onHidden?: () => any) => {
        Animated.timing(this.state.opacityAnimation, {
            toValue: 0,
            duration: this.props.animationDuration,
            easing: EASING,
            useNativeDriver: true
        }).start(() => {
            // Reset state
            this.setState(
                {
                    menuState: STATES.HIDDEN,
                    menuSizeAnimation: new Animated.ValueXY({ x: 0, y: 0 }),
                    opacityAnimation: new Animated.Value(0),
                },
                () => {
                    if (onHidden) {
                        onHidden();
                    }

                    // Invoke onHidden callback if defined
                    if (Platform.OS !== 'ios' && this.props.onHidden) {
                        this.props.onHidden();
                    }
                },
            );
        });
    };

    // @@ TODO: Rework this
    _hide = () => {
        this.hide();
    };

    render() {
        const { isRTL } = I18nManager;
        const {screenIndent} = this.props;

        const dimensions = Dimensions.get('window');
        const { width: windowWidth } = dimensions;
        const windowHeight = dimensions.height - (StatusBar.currentHeight || 0);

        const {
            menuSizeAnimation,
            menuWidth,
            menuHeight,
            buttonWidth,
            buttonHeight,
            opacityAnimation,
        } = this.state;
        const menuSize = {
            width: menuSizeAnimation.x,
            height: menuSizeAnimation.y,
        };

        // Adjust position of menu
        let { left, top } = this.state;
        const transforms: any[] = [];

        if (
            (isRTL && left + buttonWidth - menuWidth > screenIndent) ||
            (!isRTL && left + menuWidth > windowWidth - screenIndent)
        ) {
            transforms.push({
                translateX: Animated.multiply(menuSizeAnimation.x, -1),
            });

            left = Math.min(windowWidth - screenIndent, left + buttonWidth);
        } else if (left < screenIndent) {
            left = screenIndent;
        }

        // Flip by Y axis if menu hits bottom screen border
        if (top > windowHeight - menuHeight - screenIndent) {
            transforms.push({
                translateY: Animated.multiply(menuSizeAnimation.y, -1),
            });

            top = windowHeight - screenIndent;
            top = Math.min(windowHeight - screenIndent, top + buttonHeight);
        } else if (top < screenIndent) {
            top = screenIndent;
        }

        const shadowMenuContainerStyle = {
            opacity: opacityAnimation,
            transform: transforms,
            top,

            // Switch left to right for rtl devices
            ...(isRTL ? { right: left } : { left }),
        };

        const { menuState } = this.state;
        const animationStarted = menuState === STATES.ANIMATING;
        const modalVisible = menuState === STATES.SHOWN || animationStarted;

        const { button, style, children, parentStyle, ...props } = this.props;

        return (
            <View ref={this._setContainerRef} collapsable={false} style={parentStyle} {...props}>
                <View>{button}</View>

                <Modal
                    visible={modalVisible}
                    onRequestClose={this._hide}
                    supportedOrientations={[
                        'portrait',
                        'portrait-upside-down',
                        'landscape',
                        'landscape-left',
                        'landscape-right',
                    ]}
                    transparent
                    onDismiss={this._onDismiss}
                >
                    <TouchableWithoutFeedback onPress={this._hide} accessible={false}>
                        <View style={StyleSheet.absoluteFill}>
                            <Animated.View
                                onLayout={this._onMenuLayout}
                                style={[
                                    styles.shadowMenuContainer,
                                    shadowMenuContainerStyle,
                                    style,
                                ]}
                            >
                                <Animated.View
                                    style={[styles.menuContainer, animationStarted && menuSize]}
                                >
                                    {children}
                                </Animated.View>
                            </Animated.View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </View>
        );
    }
}

const Menu = memo(forwardRef(({animationDuration = 300, screenIndent = 8, ...props}: Props, ref: Ref<MenuContent>) => {
    return <MenuContent ref={ref} animationDuration={300} screenIndent={screenIndent} {...props}/>
}));

const styles = StyleSheet.create({
    shadowMenuContainer: {
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: 4,
        opacity: 0,

        // Shadow
        ...Platform.select({
            ios: {
                shadowColor: 'black',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.14,
                shadowRadius: 2,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    menuContainer: {
        overflow: 'hidden',
    },
});

export default Menu;
