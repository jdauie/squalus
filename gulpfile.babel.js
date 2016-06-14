import gulp from 'gulp';
import path from 'path';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import gutil from 'gulp-util';
import webpack from 'webpack';
import webpackNodeConfig from './webpack.config.node.babel';
import webpackWebConfig from './webpack.config.web.babel';
import WebpackDevServer from 'webpack-dev-server';
import { squalus } from './src/SqualusNode';
import AllTestsCollection from './sandbox/tests/All';

const devServerPort = 8080;

function buildWebpackConfig(config, callback) {
  webpack(config, (err, stats) => {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack:build]', stats.toString({
      colors: true,
      progress: true,
    }));
    callback();
  });
}

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
  buildWebpackConfig([
    Object.create(webpackNodeConfig),
    Object.create(webpackWebConfig),
  ], callback);
});

gulp.task('webpack:server', ['webpack:build'], () => {
  const config = Object.create(webpackWebConfig);
  config.debug = true;

  new WebpackDevServer(webpack(config), {
    publicPath: `/${config.output.publicPath}`,
    stats: {
      colors: true,
    },
    hot: true,
  }).listen(devServerPort, '0.0.0.0', (err) => {
    if (err) throw new gutil.PluginError('webpack-dev-server', err);
    gutil.log('[webpack-dev-server]', `http://localhost:${devServerPort}/webpack-dev-server`);
  });
});
