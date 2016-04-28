import gulp from 'gulp';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import gutil from 'gulp-util';
import webpack from 'webpack';
import webpackConfig from './webpack.config.babel';
import WebpackDevServer from 'webpack-dev-server';

gulp.task('default', ['webpack']);

gulp.task('babel', () =>
  gulp.src('src/*.js')
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

gulp.task('watch-test', () =>
  gulp.watch(['src/**', 'test/**'], ['test'])
);

gulp.task('webpack', ['test'], (callback) => {
  const myConfig = Object.create(webpackConfig);
  myConfig.devtool = 'source-map';
  myConfig.plugins = [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
  ];

  // run webpack
  webpack(myConfig, (err, stats) => {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack]', stats.toString({
      colors: true,
      progress: true,
    }));
    callback();
  });
});

gulp.task('server', ['webpack'], () => {
  // modify some webpack config options
  const myConfig = Object.create(webpackConfig);
  myConfig.devtool = 'eval';
  myConfig.debug = true;

  // Start a webpack-dev-server
  new WebpackDevServer(webpack(myConfig), {
    publicPath: `/${myConfig.output.publicPath}`,
    stats: {
      colors: true,
    },
    hot: true,
  }).listen(8080, 'localhost', (err) => {
    if (err) throw new gutil.PluginError('webpack-dev-server', err);
    gutil.log('[webpack-dev-server]', 'http://localhost:8080/webpack-dev-server/index.html');
  });
});
