var _ = require('lodash');
var buffer = require('vinyl-buffer');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var gulp  = require('gulp');
var gulpIf = require('gulp-if');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var watchify = require('watchify');

var config  = require('../config').js;
var helpers = require('../helpers');

var jsTask = function(taskName, options, dest) {
    var bundler = null;
    var bundlerOpts = _.omit(options, [
        'watch',
        'ugly'
    ]);

    if (options.watch) {
        bundlerOpts = _.defaults(bundlerOpts, watchify.args);
    }

    bundler = browserify(config.paths.src, bundlerOpts);

    var task = function() {
        return bundler
            .bundle()
            .on('error', function(err) {
                helpers.logError(taskName, err);
                this.emit('end');
            })
            .pipe(source('bundle.js'))
            .pipe(buffer())
            .pipe(gulpIf(options.ugly, uglify()))
            .pipe(rename(options.bundleName))
            .on('error', function(err) {
                helpers.logError(taskName, err.message);
            })
            .pipe(gulp.dest(dest))
            .pipe(browserSync.reload({ stream: true }));
    };

    var rebundle = function () {
        return helpers.wrapStatus('JS Build', task);
    };

    if(options.watch) {
        bundler = watchify(bundler);
        bundler.on('update', rebundle);
    }

    return rebundle();
};

gulp.task('js-dev', function() {
    return jsTask('js-dev', config.dev, config.paths.dest.dev);
});

gulp.task('js-prod', function() {
    return jsTask('js-prod', config.prod, config.paths.dest.prod);
});

gulp.task('js-static', function() {
    return jsTask('js-static', config.static, config.paths.dest.static);
});
