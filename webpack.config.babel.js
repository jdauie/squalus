import path from 'path';
import externals from 'webpack-node-externals';

export default {
  entry: {
    squalus: './src/SqualusNode.js',
  },
  output: {
    path: path.join(__dirname, 'lib'),
    publicPath: 'lib/',
    filename: '[name].js',
    chunkFilename: '[id].js',
    sourceMapFilename: '[name].js.map',
    libraryTarget: 'commonjs2',
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
  externals: [externals()],
};
