const webpack = require('webpack'); // to access built-in plugins

module.exports = {
  mode: 'development',
  plugins: [
    new webpack.IgnorePlugin(/(fs|child_process)/),
  ],
};
