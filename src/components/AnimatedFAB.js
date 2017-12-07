/* @flow */

import * as React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import withTheme from '../core/withTheme';
import { grey400 } from '../styles/colors';

import FAB from './FAB';

type Props = {
  items: [{ icon: string }],
};

type State = {
  animate: Animated.Value,
  fabs: Animated.Value[],
  isOpen: boolean,
};

class AnimatedFABExample extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      animate: new Animated.Value(0),
      fabs: new Array(props.items.length).fill(new Animated.Value(0)),
      isOpen: false,
    };
  }

  toggleModal = () => {
    const toValue = this.state.isOpen ? 0 : 1;
    if (!this.state.isOpen) {
      this.setState(
        () => ({
          isOpen: !this.state.isOpen,
        }),
        () => {
          Animated.timing(this.state.animate, {
            toValue,
            duration: 100,
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
      Animated.timing(this.state.animate, {
        toValue,
        duration: 100,
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
    console.log(this.state.fabs);

    const fabRotate = this.state.animate.interpolate({
      inputRange: [0, 1],
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

    const fabfabStyle = {
      height: 88,
      width: 88,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    };

    return (
      <Animated.View style={[styles.fab]}>
        <View>
          <Modal
            visible={this.state.isOpen}
            transparent
            onRequestClose={this.toggleModal}
            animationType="fade"
          >
            <TouchableWithoutFeedback onPress={this.toggleModal}>
              <View style={[StyleSheet.absoluteFill, styles.abc]}>
                <View style={styles.fabs}>
                  {this.state.fabs.map((animation, i) => {
                    const move = animation.interpolate({
                      inputRange: [0, 1],
                      // $FlowFixMe
                      outputRange: [0, `${i + 1}` * -70],
                    });
                    const fabStyleTranslate = {
                      transform: [
                        {
                          translateY: move,
                        },
                      ],
                      height: 88,
                      width: 88,
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    };
                    return (
                      <Animated.View
                        key={i}
                        style={[styles.fab, fabStyleTranslate]}
                      >
                        <FAB
                          icon={this.props.items[i].icon}
                          small
                          style={{ backgroundColor: grey400 }}
                        />
                      </Animated.View>
                    );
                  })}
                </View>
                <Animated.View style={[styles.position, fabStyle]}>
                  <FAB
                    onPress={this.toggleModal}
                    icon="add"
                    style={{ elevation: 0 }}
                  />
                </Animated.View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          <Animated.View style={fabfabStyle}>
            <FAB onPress={this.toggleModal} icon="add" />
          </Animated.View>
        </View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  fabs: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  fab: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  abc: {
    backgroundColor: 'rgba(0, 0, 0, .5)',
  },
});

export default withTheme(AnimatedFABExample);
