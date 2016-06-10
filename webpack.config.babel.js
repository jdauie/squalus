import path from 'path';

export default {
  entry: {
    squalus: './src/index.js',
  },
  output: {
    path: path.join(__dirname, 'lib'),
    publicPath: 'lib/',
    filename: '[name].js',
    chunkFilename: '[id].js',
    sourceMapFilename: '[name].js.map',
  },
  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js'],
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
      },
    ],
  },
  resolveLoader: {
    modulesDirectories: ['node_modules'],
    root: path.resolve(__dirname, 'node_modules'),
  },
};
