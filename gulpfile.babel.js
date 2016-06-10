// eslint-disable-line global-require

import gulp from 'gulp';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import gutil from 'gulp-util';
import webpack from 'webpack';
import webpackConfig from './webpack.config.babel';
import WebpackDevServer from 'webpack-dev-server';
import fs from 'fs';
import yaml from 'js-yaml';
import Squalus from './src/Squalus';

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

gulp.task('test:api', ['babel'], () => {
  const typePath = `${__dirname}/sandbox/types`;
  const testPath = `${__dirname}/sandbox/tests/All.js`;
  const context = {
    baseUrl: 'http://localjournal.submishmash.com',
    adminUser: 'josh+level5@submittable.com',
    adminPassword: 'password',
  };

  let files = [typePath];
  if (fs.statSync(typePath).isDirectory()) {
    files = fs.readdirSync(typePath).map(f => `${typePath}/${f}`);
  }
  const types = Object.assign.apply(null,
    files.map(file => yaml.safeLoad(fs.readFileSync(file, { encoding: 'utf8' })))
  );

  Squalus.buildTypes(types);

  const collection = require(testPath).default;
  return collection.execute(context);
});

gulp.task('watch', () =>
  gulp.watch(['src/**', 'test/**'], ['test'])
);

gulp.task('webpack:build', [], (callback) => {
  const config = Object.create(webpackConfig);
  config.devtool = 'source-map';
  config.plugins = [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
  ];

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
