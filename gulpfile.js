'use strict';

const gulp = require('gulp');
const gulpLoad = require('gulp-load-plugins');

const plugins = gulpLoad();

const onError = err => console.error(err) || process.exit(1);

gulp.task('jshint', () => {
  return gulp.src('./index.js')
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'))
    .once('error', onError);
});

gulp.task('test', () => {
  return gulp.src('./test.js', { read: false })
  .pipe(plugins.mocha({ reporter: 'spec' }))
  .once('error', onError);
});

gulp.task('default', cbk => gulp.watch([ './index.js', './test.js' ], [ 'jshint', 'test' ], cbk));
