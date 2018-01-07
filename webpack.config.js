module.exports = {
  context: __dirname + '/src/scripts',
  entry: {
    'index': './index.js',
    'popup': './popup.js',
    'options': './options.js',
    'popup': './popup.js'
  },
  output: {
    path: __dirname + '/dist/scripts',
    filename: "[name].js",
    chunkFilename: "[id].js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query:{
          presets: [
            ["env", {
              "targets": {
                "chrome": 59
              },
              "loose": true
            }]
          ],
          plugins: [
            "transform-class-properties"
          ]
        }
      }
    ]
  }
};
