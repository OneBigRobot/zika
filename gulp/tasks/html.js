var browserSync = require('browser-sync');
var gulp = require('gulp');
var swig = require('gulp-swig');

var config = require('../config').html;
var helpers = require('../helpers');

var htmlTask = function(taskName, src, dest) {
    return gulp.src(src)
        .pipe(swig(config))
        .on('error', function(err) {
            helpers.logError(taskName, err.message);
            this.emit('end');
        })
        .pipe(gulp.dest(dest))
        .pipe(browserSync.reload({ stream: true }));
};

gulp.task('html-dev', function() {
    return htmlTask('html-dev', config.paths.src.html, config.paths.dest.dev);
});

gulp.task('html-prod', function() {
    return htmlTask('html-prod', config.paths.src.html, config.paths.dest.prod);
});

gulp.task('html-static', function() {
    return htmlTask('html-static', config.paths.src.html, config.paths.dest.static);
});
