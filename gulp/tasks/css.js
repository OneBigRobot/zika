var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var gulp = require('gulp');
var gulpIf = require('gulp-if');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

var config = require('../config').css;
var helpers = require('../helpers');

var cssTask = function(taskName, options, dest) {
    var task = function() {
        return gulp.src(config.paths.src)
            .pipe(gulpIf(options.sourcemap, sourcemaps.init()))
            .pipe(sass(options))
            .on('error', function(err) {
                helpers.logError(taskName, err.message);
                this.emit('end');
            })
            .pipe(autoprefixer({ browsers: ['last 2 version'] }))
            .pipe(gulpIf(options.sourcemap, sourcemaps.write()))
            .pipe(gulpIf(!!options.rename, rename(options.rename)))
            .pipe(gulp.dest(dest))
            .pipe(browserSync.reload({ stream: true }));
    };

    return helpers.wrapStatus(taskName, task);
};

gulp.task('css-dev', function() {
    return cssTask('Css-Dev', config.dev, config.paths.dest.dev);
});

gulp.task('css-prod', function() {
    return cssTask('Css-Prod', config.prod, config.paths.dest.prod);
});

gulp.task('css-static', function() {
    return cssTask('Css-static', config.static, config.paths.dest.static);
});
