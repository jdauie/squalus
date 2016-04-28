import path from 'path';

module.exports = {
  entry: {
    squalus: './target/index.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '../dist/',
    filename: '[name].js',
    chunkFilename: '[id].js',
    sourceMapFilename: '[name].js.map',
  },
};
