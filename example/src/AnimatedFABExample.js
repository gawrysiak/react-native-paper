/* @flow */

import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedFAB, withTheme, Button } from 'react-native-paper';
import type { Theme } from 'react-native-paper/types';

type Props = {
  theme: Theme,
};

type State = {
  loading: boolean,
};

const items = [
  { icon: 'add', onPress: () => {} },
  { icon: 'today', label: 'Calendar', onPress: () => {} },
  { icon: 'email', label: 'Email', onPress: () => {} },
  { icon: 'star', onPress: () => {} },
];
class AnimatedFABExample extends React.Component<Props, State> {
  static title = 'Animated';

  state = {
    loading: true,
  };

  render() {
    const { theme: { colors: { background } } } = this.props;
    return (
      <View style={[styles.container, { backgroundColor: background }]}>
        <View>
          <Button>Simple</Button>
          <Button primary>Primary</Button>
          <Button>Custom</Button>
        </View>
        <AnimatedFAB icon="add" items={items} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default withTheme(AnimatedFABExample);
