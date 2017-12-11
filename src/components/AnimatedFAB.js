/* @flow */

import * as React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
} from 'react-native';
import withTheme from '../core/withTheme';
import type { Theme } from '../types';

import FAB from './FAB';

type Props = {
  items: [{ icon: string }],
  theme: Theme,
};

type State = {
  animatedValue: Animated.Value,
  fabs: Animated.Value[],
  isOpen: boolean,
};

class AnimatedFABExample extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      animatedValue: new Animated.Value(0),
      fabs: new Array(props.items.length).fill(new Animated.Value(0)),
      isOpen: false,
    };
  }

  componentWillUpdate(_, nextState) {
    Platform.OS === 'ios' && nextState.isOpen
      ? StatusBar.setBarStyle('dark-content')
      : StatusBar.setBarStyle('light-content');
  }

  toggleModal = () => {
    const toValue = this.state.isOpen ? 0 : 1;
    if (!this.state.isOpen) {
      this.setState(
        () => ({
          isOpen: !this.state.isOpen,
        }),
        () => {
          Animated.timing(this.state.animatedValue, {
            toValue,
            duration: 100,
            useNativeDriver: true,
          }).start();
          this.state.fabs.map(animation =>
            Animated.timing(animation, {
              toValue,
              duration: 100,
              useNativeDriver: true,
            }).start()
          );
        }
      );
    } else {
      Animated.timing(this.state.animatedValue, {
        toValue,
        duration: 100,
        useNativeDriver: true,
      }).start();
      Animated.parallel(
        this.state.fabs.map(animation =>
          Animated.timing(animation, {
            toValue,
            duration: 100,
            useNativeDriver: true,
          })
        )
      ).start(() => {
        this.setState({ isOpen: !this.state.isOpen });
      });
    }
  };

  render() {
    const { colors } = this.props.theme;

    const fabRotate = this.state.animatedValue.interpolate({
      inputRange: [0, 1],
      // $FlowFixMe
      outputRange: ['0deg', '135deg'],
    });

    const fabStyle = {
      transform: [
        {
          rotate: fabRotate,
        },
      ],
      height: 88,
      width: 88,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    };

    return (
      <Animated.View style={styles.positionAbsolute}>
        <View>
          <Modal
            visible={this.state.isOpen}
            transparent
            onRequestClose={this.toggleModal}
          >
            <TouchableWithoutFeedback onPress={this.toggleModal}>
              <View style={[StyleSheet.absoluteFill, styles.layout]}>
                <View style={styles.positionAbsolute}>
                  {this.state.fabs.map((animation, i) => {
                    const move = animation.interpolate({
                      inputRange: [0, 1],
                      // $FlowFixMe
                      outputRange: [0, `${i + 1}` * -70],
                    });

                    const opacity = animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    });
                    const fabStyleTranslate = {
                      transform: [
                        {
                          translateY: move,
                        },
                      ],
                      opacity: opacity,
                    };
                    return (
                      <Animated.View
                        key={i}
                        style={[
                          styles.positionAbsolute,
                          styles.overflow,
                          fabStyleTranslate,
                        ]}
                      >
                        <FAB
                          dark
                          icon={this.props.items[i].icon}
                          small
                          style={[
                            styles.fab,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      </Animated.View>
                    );
                  })}
                </View>
                <Animated.View
                  style={[styles.positionAbsolute, styles.overflow, fabStyle]}
                >
                  <FAB
                    dark
                    onPress={this.toggleModal}
                    icon="add"
                    style={styles.fab}
                  />
                </Animated.View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          <Animated.View style={styles.overflow}>
            <FAB
              dark
              onPress={this.toggleModal}
              icon="add"
              style={styles.fab}
            />
          </Animated.View>
        </View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  positionAbsolute: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  overflow: {
    height: 88,
    width: 88,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layout: {
    backgroundColor: 'rgba(255, 255, 255, .9)',
  },
  fab: {
    elevation: 7,
  },
});

export default withTheme(AnimatedFABExample);
