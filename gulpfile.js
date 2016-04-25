var gulp = require('gulp');

require('require-dir')(
    './gulp/tasks',
    { recurse: true }
);

gulp.task('dev', [
    'js-dev',
    'css-dev',
    'html-dev'
]);

gulp.task('production', [
    'js-prod',
    'css-prod',
    'copy-prod',
    'html-prod'
]);

gulp.task('static', [
    'js-static',
    'css-static',
    'html-static'
]);

gulp.task('default', [
    'dev',
    'watch',
    'browserSync'
]);
