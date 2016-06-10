import gulp from 'gulp';
import path from 'path';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import gutil from 'gulp-util';
import webpack from 'webpack';
import webpackConfig from './webpack.config.babel';
import WebpackDevServer from 'webpack-dev-server';
import { squalus } from './src/SqualusNode';
import AllTestsCollection from './sandbox/tests/All';

gulp.task('default', ['webpack:build']);

gulp.task('babel', () =>
  gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('target'))
);

gulp.task('test', ['babel'], () =>
  gulp.src('test/*.js')
    .pipe(mocha())
    .on('error', () => {
      gulp.emit('end');
    })
);

gulp.task('test:api', () =>
  squalus.execute(
    path.join(__dirname, '/sandbox/tests'),
    AllTestsCollection,
    path.join(__dirname, '/sandbox/tests/All.context.json')
  )
);

gulp.task('webpack:build', [], (callback) => {
  const config = Object.create(webpackConfig);
  config.devtool = 'source-map';
  config.plugins = [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
  ];
  config.target = 'node';

  webpack(config, (err, stats) => {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack:build]', stats.toString({
      colors: true,
      progress: true,
    }));
    callback();
  });
});

gulp.task('webpack:server', ['webpack:build'], () => {
  const config = Object.create(webpackConfig);
  config.devtool = 'source-map';
  config.debug = true;

  new WebpackDevServer(webpack(config), {
    publicPath: `/${config.output.publicPath}`,
    stats: {
      colors: true,
    },
    hot: true,
  }).listen(8080, 'localhost', (err) => {
    if (err) throw new gutil.PluginError('webpack-dev-server', err);
    gutil.log('[webpack-dev-server]', 'http://localhost:8080/webpack-dev-server');
  });
});
