/* @flow */

import * as React from 'react';
import {
  View,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import color from 'color';
import Icon from './Icon';
import Paper from './Paper';
import Text from './Typography/Text';
import { black, white } from '../styles/colors';
import withTheme from '../core/withTheme';
import type { Theme } from '../types';
import type { IconSource } from './Icon';
import type { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedPaper = Animated.createAnimatedComponent(Paper);

type Route = {
  key: string,
  title: string,
  icon: IconSource,
  color?: string,
};

type NavigationState<T> = {
  index: number,
  routes: Array<T>,
};

type Props<T> = {
  /**
   * State for the bottom navigation. The state should contain the following properties:
   *
   * - `index`: a number reprsenting the index of the active route in the `routes` array
   * - `routes`: an array containing a list of route objects used for rendering the tabs
   *
   * Each route object should contain the following properties:
   *
   * - `key`: a unique key to identify the route
   * - `title`: title of the route to use as the tab label
   * - `icon`: icon to use as the tab icon, can be a string, an image source or a react component
   * - `color`: color to use as background color for shifting bottom navigation (optional)
   *
   * Example:
   *
   * ```js
   * {
   *   index: 1,
   *   routes: [
   *     { key: 'music', title: 'Music', icon: 'queue-music', color: '#3F51B5' },
   *     { key: 'albums', title: 'Albums', icon: 'album', color: '#009688' },
   *     { key: 'recents', title: 'Recents', icon: 'history', color: '#795548' },
   *     { key: 'purchased', title: 'Purchased', icon: 'shopping-cart', color: '#607D8B' },
   *   ]
   * }
   * ```
   *
   * `BottomNavigation` is a controlled component, which means the `index` needs to be updated via the `onIndexChange` callback.
   */
  navigationState: NavigationState<T>,
  /**
   * Callback which is called on tab change, receives the index of the new tab as argument.
   * The navigation state needs to be updated when it's called, otherwise the change is dropped.
   */
  onIndexChange: (index: number) => void,
  /**
   * Callback which returns a react element to render as the page for the tab. Receives an object containing the route as the argument:
   *
   * ```js
   * renderScene = ({ route, jumpTo }) => {
   *   switch (route.key) {
   *     case 'music':
   *       return <MusicRoute jumpTo={jumpTo} />;
   *     case 'albums':
   *       return <AlbumsRoute jumpTo={jumpTo} />;
   *   }
   * }
   * ```
   *
   * You need to make sure that your individual routes implement a `shouldComponentUpdate` to improve the performance.
   * To make it easier to specify the components, you can use the `SceneMap` helper:
   *
   * ```js
   * renderScene = BottomNavigation.SceneMap({
   *   music: MusicRoute,
   *   albums: AlbumsRoute,
   * });
   * ```
   *
   * Specifying the components this way is easier and takes care of implementing a `shouldComponentUpdate` method.
   * Each component will receive the current route and a `jumpTo` method as it's props.
   * The `jumpTo` method can be used to navigate to other tabs programmatically:
   *
   * ```js
   * this.props.jumpTo('albums')
   * ```
   */
  renderScene: (props: {
    route: T,
    jumpTo: (key: string) => mixed,
  }) => ?React.Node,
  /**
   * Whether the shifting style is used, the active tab appears wider and the inactive tabs won't have a label.
   * By default, this is `true` when you have more than 3 tabs.
   */
  shifting?: boolean,
  /**
   * Function to execute on tab press. It receives the route for the pressed tab, useful for things like scroll to top.
   */
  onTabPress?: (props: { route: T }) => mixed,
  style?: StyleProp,
  /**
   * @optional
   */
  theme: Theme,
};

type State = {
  tabs: Animated.Value[],
  shifts: Animated.Value[],
  index: Animated.Value,
  ripple: Animated.Value,
  layout: { height: number, width: number, measured: boolean },
};

const MIN_RIPPLE_SCALE = 0.1;

/**
 * Bottom navigation provides quick navigation between top-level views of an app with a bottom tab bar.
 * It is primarily designed for use on mobile.
 *
 * <div class="screenshots">
 *   <img class="medium" src="screenshots/bottom-navigation.gif" />
 * </div>
 *
 * ## Usage
 * ```js
 * export default class MyComponent extends React.Component {
 *   state = {
 *     index: 0,
 *     routes: [
 *       { key: 'music', title: 'Music', icon: 'queue-music' },
 *       { key: 'albums', title: 'Albums', icon: 'album' },
 *       { key: 'recents', title: 'Recents', icon: 'history' },
 *     ],
 *   };
 *
 *   _handleIndexChange = index => this.setState({ index });
 *
 *   _renderScene = BottomNavigation.SceneMap({
 *     music: MusicRoute,
 *     albums: AlbumsRoute,
 *     recents: RecentsRoute,
 *   });
 *
 *   render() {
 *     return (
 *       <BottomNavigation
 *         navigationState={this.state}
 *         onIndexChange={this._handleIndexChange}
 *         renderScene={this._renderScene}
 *       />
 *     );
 *   }
 * }
 * ```
 */
class BottomNavigation<T: Route> extends React.Component<Props<T>, State> {
  static SceneMap(scenes: { [key: string]: Function }) {
    /* eslint-disable react/no-multi-comp */
    class SceneComponent extends React.PureComponent<*> {
      render() {
        return React.createElement(scenes[this.props.route.key], this.props);
      }
    }

    return ({ route, jumpTo }: *) => (
      <SceneComponent key={route.key} route={route} jumpTo={jumpTo} />
    );
  }

  constructor(props) {
    super(props);

    const { routes, index } = this.props.navigationState;

    this.state = {
      tabs: routes.map((_, i) => new Animated.Value(i === index ? 1 : 0)),
      shifts: routes.map(
        (_, i) =>
          new Animated.Value(this._getShiftAmount(index, i, routes.length))
      ),
      index: new Animated.Value(index),
      ripple: new Animated.Value(MIN_RIPPLE_SCALE),
      layout: { height: 0, width: 0, measured: false },
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.navigationState.index !== this.props.navigationState.index) {
      const { routes, index } = this.props.navigationState;

      this.state.ripple.setValue(MIN_RIPPLE_SCALE);

      Animated.parallel([
        ...routes.map((_, i) =>
          Animated.timing(this.state.tabs[i], {
            toValue: i === index ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
          })
        ),
        ...routes.map((_, i) =>
          Animated.timing(this.state.shifts[i], {
            toValue: this._getShiftAmount(index, i, routes.length),
            duration: 200,
            useNativeDriver: true,
          })
        ),
        Animated.timing(this.state.ripple, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Workaround a bug in native animations where this is reset after first animation
        this.state.tabs.map((tab, i) => tab.setValue(i === index ? 1 : 0));
        this.state.index.setValue(index);
        this.state.ripple.setValue(MIN_RIPPLE_SCALE);
      });
    }
  }

  _getShiftAmount = (activeIndex, currentIndex, numberOfItems) => {
    if (activeIndex < currentIndex) {
      return 2;
    }

    if (activeIndex > currentIndex) {
      return -2;
    }

    if (activeIndex === currentIndex) {
      if (currentIndex === 0) {
        return 1;
      }

      if (currentIndex === numberOfItems - 1) {
        return -1;
      }
    }

    return 0;
  };

  _handleLayout = e =>
    this.setState({
      layout: {
        height: e.nativeEvent.layout.height,
        width: e.nativeEvent.layout.width,
        measured: true,
      },
    });

  _handleTabPress = (index: number) => {
    if (index !== this.props.navigationState.index) {
      this.props.onIndexChange(index);
    }

    if (this.props.onTabPress) {
      const route = this.props.navigationState.routes[index];
      this.props.onTabPress({ route });
    }
  };

  _jumpTo = (key: string) => {
    const index = this.props.navigationState.routes.findIndex(
      route => route.key === key
    );

    this.props.onIndexChange(index);
  };

  render() {
    const { navigationState, renderScene, theme } = this.props;
    const { layout } = this.state;
    const { routes } = navigationState;
    const { colors } = theme;

    const shifting =
      typeof this.props.shifting === 'boolean'
        ? this.props.shifting
        : routes.length > 3;

    const backgroundColor = shifting
      ? this.state.index.interpolate({
          inputRange: routes.map((_, i) => i),
          outputRange: routes.map(route => route.color),
        })
      : theme.dark ? black : white;
    const activeColor = shifting ? white : colors.primary;
    const inactiveColor = shifting
      ? white
      : color(color(backgroundColor).light() ? black : white)
          .alpha(0.5)
          .rgb()
          .string();

    const maxTabWidth = routes.length > 3 ? 96 : 168;
    const tabWidth = Math.min(layout.width / routes.length, maxTabWidth);

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
          this.props.style,
        ]}
        onLayout={this._handleLayout}
        pointerEvents={this.state.layout.measured ? 'auto' : 'none'}
      >
        <View style={styles.content}>
          {routes.map((route, index) => {
            const focused = this.state.tabs[index];
            const opacity = focused.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0, 1],
            });
            const translateY = focused.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [6, 6, 0],
            });

            return (
              <Animated.View
                key={route.key}
                style={[
                  StyleSheet.absoluteFill,
                  { opacity, transform: [{ translateY }] },
                ]}
              >
                {renderScene({
                  route,
                  jumpTo: this._jumpTo,
                })}
              </Animated.View>
            );
          })}
        </View>
        <AnimatedPaper style={[styles.bar, { backgroundColor }]}>
          <View
            style={[styles.items, { maxWidth: maxTabWidth * routes.length }]}
          >
            {shifting ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.ripple,
                  {
                    top: -layout.width + 28,
                    left:
                      -layout.width +
                      tabWidth / 2 +
                      navigationState.index * tabWidth,
                    height: layout.width * 2,
                    width: layout.width * 2,
                    borderRadius: layout.width,
                    backgroundColor: routes[navigationState.index].color,
                    transform: [{ scale: this.state.ripple }],
                    opacity: this.state.ripple.interpolate({
                      inputRange: [0, 0.1, 0.2, 1],
                      outputRange: [0, 0, 1, 1],
                    }),
                  },
                ]}
              />
            ) : null}
            {routes.map((route, index) => {
              const shift = this.state.shifts[index];
              const focused = this.state.tabs[index];
              const scale = focused.interpolate({
                inputRange: [0, 1],
                outputRange: [shifting ? 0.5 : 12 / 14, 1],
              });
              const translateY = focused.interpolate({
                inputRange: [0, 1],
                outputRange: [shifting ? 10 : 2, 0],
              });
              const translateX = shifting ? Animated.multiply(shift, 5) : 0;
              const inactiveOpacity = focused.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              });
              const activeIconOpacity = shifting
                ? focused.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  })
                : focused;
              const activeLabelOpacity = focused;
              const inactiveIconOpacity = inactiveOpacity;
              const inactiveLabelOpacity = inactiveOpacity;

              return (
                <TouchableWithoutFeedback
                  key={route.key}
                  onPress={() => this._handleTabPress(index)}
                >
                  <Animated.View
                    style={[styles.item, { transform: [{ translateX }] }]}
                  >
                    <Animated.View
                      style={[
                        styles.iconContainer,
                        { transform: [{ translateY }] },
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.iconWrapper,
                          { opacity: activeIconOpacity },
                        ]}
                      >
                        <Icon
                          style={styles.icon}
                          name={route.icon}
                          color={activeColor}
                          size={24}
                        />
                      </Animated.View>
                      {shifting ? null : (
                        <Animated.View
                          style={[
                            styles.iconWrapper,
                            { opacity: inactiveIconOpacity },
                          ]}
                        >
                          <Icon
                            style={styles.icon}
                            name={route.icon}
                            color={inactiveColor}
                            size={24}
                          />
                        </Animated.View>
                      )}
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.labelContainer,
                        {
                          transform: [{ scale }, { translateY }],
                        },
                      ]}
                    >
                      <AnimatedText
                        style={[
                          styles.label,
                          {
                            opacity: activeLabelOpacity,
                            color: activeColor,
                          },
                        ]}
                      >
                        {route.title}
                      </AnimatedText>
                      {shifting ? null : (
                        <AnimatedText
                          style={[
                            styles.label,
                            {
                              opacity: inactiveLabelOpacity,
                              color: inactiveColor,
                            },
                          ]}
                        >
                          {route.title}
                        </AnimatedText>
                      )}
                    </Animated.View>
                  </Animated.View>
                </TouchableWithoutFeedback>
              );
            })}
          </View>
        </AnimatedPaper>
      </View>
    );
  }
}

export default withTheme(BottomNavigation);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bar: {
    elevation: 8,
    paddingHorizontal: 10,
    overflow: 'hidden',
    alignItems: 'center',
  },
  items: {
    flexDirection: 'row',
  },
  item: {
    flex: 1,
    paddingBottom: 10,
    paddingTop: 6,
  },
  ripple: {
    position: 'absolute',
  },
  iconContainer: {
    height: 24,
    width: 24,
    marginHorizontal: 12,
    alignSelf: 'center',
  },
  iconWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  icon: {
    backgroundColor: 'transparent',
  },
  labelContainer: {
    height: 16,
  },
  label: {
    ...StyleSheet.absoluteFillObject,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
});
