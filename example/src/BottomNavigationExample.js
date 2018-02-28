/* @flow */

import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomNavigation } from 'react-native-paper';

export default class ButtomNavigationExample extends React.Component<{}, any> {
  static title = 'Bottom navigation';

  state = {
    index: 0,
    routes: [
      { key: 'music', title: 'Music', icon: 'queue-music', color: '#3F51B5' },
      { key: 'albums', title: 'Albums', icon: 'album', color: '#009688' },
      { key: 'recents', title: 'Recents', icon: 'history', color: '#795548' },
      {
        key: 'purchased',
        title: 'Purchased',
        icon: 'shopping-cart',
        color: '#607D8B',
      },
    ],
  };

  _handleIndexChange = index => this.setState({ index });

  _renderScene = ({ route }) => (
    <View style={styles.container}>
      <Text>Route is: {route.title}</Text>
    </View>
  );

  render() {
    return (
      <BottomNavigation
        navigationState={this.state}
        onIndexChange={this._handleIndexChange}
        renderScene={this._renderScene}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
