import React from 'react';
import PropTypes from 'prop-types';
import { get, throttle, clamp } from 'lodash';
import memoizeOne from 'memoize-one';
import { setLightness, getLuminance } from 'polished';
import { ThemeProvider } from 'styled-components';
import { isHexColor } from 'validator';

import defaultTheme, { generateTheme } from '../lib/theme';

/**
 * A special `ThemeProvider` that plugs the custom collective theme, defined by the color
 * from `collective.settings.collectivePage.primaryColor`.
 */
export default class CollectiveThemeProvider extends React.PureComponent {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    collective: PropTypes.shape({
      settings: PropTypes.shape({
        collectivePage: PropTypes.shape({
          primaryColor: PropTypes.string,
        }),
      }),
    }),
  };

  state = { newPrimaryColor: null };

  getTheme = memoizeOne(primaryColor => {
    if (!primaryColor) {
      return defaultTheme;
    } else if (!isHexColor(primaryColor)) {
      console.warn(`Invalid custom color: ${primaryColor}`);
      return defaultTheme;
    } else {
      // Allow a deviation up to 25% of the default luminance
      const luminance = (getLuminance(primaryColor) - 0.5) / 2 + 0.05;
      const adjustLuminance = value => setLightness(clamp(value + luminance, 0, 0.97), primaryColor);
      return generateTheme({
        colors: {
          ...defaultTheme.colors,
          primary: {
            900: adjustLuminance(0.1),
            800: adjustLuminance(0.2),
            700: adjustLuminance(0.3),
            600: adjustLuminance(0.4),
            500: adjustLuminance(0.5),
            400: adjustLuminance(0.6),
            300: adjustLuminance(0.7),
            200: adjustLuminance(0.8),
            100: adjustLuminance(0.9),
            50: adjustLuminance(1),
          },
        },
      });
    }
  });

  onPrimaryColorChange = throttle(newPrimaryColor => {
    this.setState({ newPrimaryColor });
  }, 2000);

  render() {
    const { collective, children } = this.props;
    const primaryColor = this.state.newPrimaryColor || get(collective, 'settings.collectivePage.primaryColor');
    return (
      <ThemeProvider theme={this.getTheme(primaryColor)}>
        {typeof children === 'function' ? (
          children({ onPrimaryColorChange: this.onPrimaryColorChange })
        ) : (
          <React.Fragment>{children}</React.Fragment>
        )}
      </ThemeProvider>
    );
  }
}
