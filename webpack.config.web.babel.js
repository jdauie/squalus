import webpackConfig from './webpack.config.babel';
import path from 'path';

const obj = Object.assign({}, webpackConfig, {
  target: 'web',
  entry: {
    squalus: './src/SqualusWeb.js',
  },
  resolveLoader: {
    modulesDirectories: ['node_modules'],
    root: path.resolve(__dirname, 'node_modules'),
  },
  externals: [],
});

obj.output = Object.assign({}, obj.output, {
  libraryTarget: 'amd',
});

export default obj;
