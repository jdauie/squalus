import webpackConfig from './webpack.config.babel';

const obj = Object.assign({}, webpackConfig, {
  target: 'node',
  entry: {
    squalus: './src/SqualusNode.js',
  },
});

obj.output = Object.assign({}, obj.output, {
  libraryTarget: 'commonjs2',
});

export default obj;
