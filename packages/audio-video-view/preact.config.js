const webpack = require('webpack')
// ...
module.exports = {
  // ...
  plugins: [
      // ...
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }) 
  ]
}
export default (config, env, helpers) => {
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }) 
  );
}