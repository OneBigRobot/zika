var gulp = require('gulp');

var config = require('../config').copy;

gulp.task('copy-prod', function() {
    return gulp.src(config.prod.src)
        .pipe(gulp.dest(config.prod.dest));
});
