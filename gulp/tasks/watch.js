var gulp  = require('gulp');

var config = require('../config');

gulp.task('watch',function() {
    gulp.watch(config.css.paths.watch, ['css-dev']);
    gulp.watch(config.html.paths.watch, ['html-dev']);
});
