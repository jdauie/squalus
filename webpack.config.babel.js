import path from 'path';
import webpack from 'webpack';
import externals from 'webpack-node-externals';

export default {
  devtool: 'source-map',
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
  ],
  output: {
    path: path.join(__dirname, 'lib'),
    publicPath: 'lib/',
    filename: '[name].js',
    chunkFilename: '[id].js',
    sourceMapFilename: '[name].js.map',
    library: 'squalus',
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
