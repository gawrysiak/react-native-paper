/* @flow */

import * as React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
} from 'react-native';
import Text from './Typography/Text';
import Card from './Card/Card';
import ThemedPortal from './Portal/ThemedPortal';

import withTheme from '../core/withTheme';
import type { Theme } from '../types';

import FAB from './FAB';

type Props = {
  items: Array<Item>,
  theme: Theme,
};

type Item = {
  icon: string,
  label?: string,
  onPress: () => void,
};

type State = {
  animatedValue: Animated.Value,
  isOpen: boolean,
};

class AnimatedFABExample extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      animatedValue: new Animated.Value(0),
      isOpen: false,
    };
  }

  componentWillUpdate(_, nextState) {
    Platform.OS === 'ios' && nextState.isOpen
      ? StatusBar.setBarStyle('dark-content')
      : StatusBar.setBarStyle('light-content');
  }

  _handleOpen = () =>
    this.setState({ isOpen: true }, () => {
      Animated.timing(this.state.animatedValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.sin,
        useNativeDriver: true,
      }).start();
    });

  _handleDismiss = () =>
    this.setState({ isOpen: false }, () => {
      Animated.timing(this.state.animatedValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.sin,
        useNativeDriver: true,
      }).start();
    });

  toggleModal = () => {
    if (this.state.isOpen) {
      this._handleDismiss();
    } else {
      this._handleOpen();
    }
  };

  render() {
    const { colors, fonts } = this.props.theme;
    const { items } = this.props;

    const buttonRotate = this.state.animatedValue.interpolate(
      this.state.isOpen
        ? {
            inputRange: [0, 0.5, 1],
            // $FlowFixMe
            outputRange: ['0deg', '135deg', '135deg'],
          }
        : {
            inputRange: [0, 1],
            // $FlowFixMe
            outputRange: ['0deg', '135deg'],
          }
    );

    const backdropOpacity = this.state.isOpen
      ? this.state.animatedValue.interpolate({
          inputRange: [0, 0.5, 1],
          // $FlowFixMe
          outputRange: [0, 1, 1],
        })
      : this.state.animatedValue;

    const length = items.length + 1;
    const inputRange = Array.from({ length }).map(
      (_, i) => i * (1 / (length - 1))
    );

    const opacities = items.map(
      (_, index, self) =>
        this.state.isOpen
          ? this.state.animatedValue.interpolate({
              inputRange,
              outputRange: inputRange.map(
                (_, i) => (i < self.length - index ? 0 : 1)
              ),
            })
          : this.state.animatedValue
    );

    const scales = opacities.map(opacity =>
      opacity.interpolate({
        inputRange: [0, 1],
        // $FlowFixMe
        outputRange: [0.8, 1],
      })
    );

    return (
      <ThemedPortal>
        <View pointerEvents="box-none" style={styles.container}>
          <TouchableWithoutFeedback onPress={this._handleDismiss}>
            <Animated.View
              pointerEvents={this.state.isOpen ? 'auto' : 'none'}
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            />
          </TouchableWithoutFeedback>
          <View pointerEvents={this.state.isOpen ? 'auto' : 'none'}>
            {items.map((it, i) => {
              return (
                <Animated.View
                  key={i}
                  style={[
                    {
                      opacity: opacities[i],
                    },
                  ]}
                  pointerEvents="box-none"
                >
                  <View style={[styles.item]}>
                    {it.label && (
                      <Card
                        style={[
                          styles.label,
                          {
                            transform: [{ scale: scales[i] }],
                          },
                        ]}
                        onPress={it.onPress}
                      >
                        <Text style={{ fontFamily: fonts.medium }}>
                          {it.label}
                        </Text>
                      </Card>
                    )}
                    <FAB
                      dark
                      icon={it.icon}
                      small
                      style={[
                        {
                          backgroundColor: colors.primary,
                          transform: [{ scale: scales[i] }],
                        },
                      ]}
                      onPress={it.onPress}
                    />
                  </View>
                </Animated.View>
              );
            })}
          </View>
          <FAB
            dark
            onPress={this.toggleModal}
            icon="add"
            style={[styles.fab, { transform: [{ rotate: buttonRotate }] }]}
          />
        </View>
      </ThemedPortal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  fab: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, .9)',
  },
  label: {
    borderRadius: 5,
    elevation: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginVertical: 8,
    marginHorizontal: 24,
  },
  item: {
    marginHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default withTheme(AnimatedFABExample);
