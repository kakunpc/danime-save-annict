const gulp = require('gulp');
const webpack = require('webpack-stream');
const webpackConfig = require('./webpack.config');
const path = require('path');
const shell = require('gulp-shell');
const rework = require('gulp-rework');
const reworkNPM = require('rework-npm');

/**
 * js をビルドします
 */
function buildWebpack() {
  const src = path.resolve(webpackConfig.context, webpackConfig.entry['index']);
  return gulp.src(src)
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest(webpackConfig.output.path));
}

/**
 * css をビルドします。
 * といっても今はコピーするだけ
 */
function buildJS() {
  return gulp.src('src/js/*.js')
    .pipe(gulp.dest('dist/js'));
}

/**
 * fonts をビルドします。
 * といっても今はコピーするだけ
 */
function buildfonts() {
  return gulp.src('src/fonts/*.*')
    .pipe(gulp.dest('dist/fonts'));
}


/**
 * css をビルドします。
 * といっても今はコピーするだけ
 */
function buildCSS() {
  return gulp.src('src/styles/*.css')
    .pipe(rework(reworkNPM()))
    .pipe(gulp.dest('dist/styles'));
}

/**
 * html をビルドします。
 * といっても今はコピーするだけ
 */
function buildHTML() {
  return gulp.src('src/html/*.html')
    .pipe(gulp.dest('dist/html'));
}

/**
 * リリースに必要なファイルだけ release ディレクトリにコピーします
 */
const releaseCopy = gulp.parallel([
  releaseCopyJSCSS, releaseCopyManifest
]);

function releaseCopyJSCSS() {
  return gulp.src(
    ['dist/scripts/*.js', 'dist/styles/*.css', 'dist/html/*.html', 'dist/js/*.js', 'dist/fonts/*.*'],
    { base: './dist' }
  )
    .pipe(gulp.dest('release'));
}

function releaseCopyManifest() {
  return gulp.src(
    ['manifest.json'],
    { base: './' }
  )
    .pipe(gulp.dest('release'));
}

/**
 * release ディレクトリをzip圧縮します。
 * @param done
 */
function zip(done) {
  return shell.task([
    'zip release.zip -qr release -X'
  ])(done);
}

const build = gulp.series(
  gulp.parallel([buildWebpack, buildCSS, buildHTML, buildJS, buildfonts]),
  releaseCopy
);

const buildForChromeWebStore = gulp.series(
  build,
  zip
);
gulp.task('watch', function () {
  build()
  gulp.watch('./src/scripts/*.js', build)
  gulp.watch('./src/html/*.html', build)
  gulp.watch('./*.json', build)
});

gulp.task('buildWebpack', buildWebpack);
gulp.task('releaseCopy', releaseCopy);
gulp.task('zip', zip);

gulp.task('build', build);
gulp.task('buildForChromeWebStore', buildForChromeWebStore);
