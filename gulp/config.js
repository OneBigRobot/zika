var deepExtend = require('deep-extend');
var fs = require('fs');
var quaff = require('quaff');

// Optionally load user configuration options. See this link for more
// information:
// https://github.com/WPMedia/postgraphics/tree/master/_patterns/gulp/wapo-gulp-config
try {
    var userConfig = require('../../../gulp-config-overrides');
    process.stdout.write('Attempting to load custom configuration options\n');
} catch (e) {
}

var config = {
    browserSync: {
        server: {
            baseDir: 'public'
        },
        ghostMode: false
    },
    js: {
        paths: {
            src: ['src/js/base.js'],
            dest: {
                dev: 'public/js',
                prod: 'public-prod/js',
                static: 'public/js'
            }
        },
        dev: {
            bundleName: 'base.js',
            debug: true,
            watch: true,
        },
        prod: {
            bundleName: 'base.js',
            debug: false,
            ugly: true,
        },
        static: {
            bundleName: 'postGraphicsTemplate.js',
            debug: false,
            ugly: true,
        }
    },
    css: {
        paths: {
            src: ['src/sass/base.scss'],
            dest: {
                dev: 'public/css',
                prod: 'public-prod/css',
                static: 'public/css'
            },
            watch: ['src/sass/**/*.scss']
        },
        dev: {
            outputStyle: 'compact',
            sourcemap: true
        },
        prod: {
            outputStyle: 'compressed',
            sourcemap: false
        },
        static: {
            outputStyle: 'compressed',
            sourcemap: false,
            rename: 'postGraphicsTemplate.css'
        }
    },
    html: {
        paths: {
            src: {
                data: ['data/**/*'],
                html: ['src/html/index.html']
            },
            dest: {
                dev: 'public',
                prod: 'public-prod',
                static: 'public'
            },
            watch: ['src/**/*.html', 'data/**/*']
        },
        data: function() {
            return quaff('data/');
        },
        defaults: {
            cache: false
        }
    },
    copy: {
        prod: {
            // Copy every file that isn't handled by another gulp task
            // Also skip everything in the assets folder
            src: 'public/**/*!(assets)/!(base.js|base.css|index.html)',
            dest: 'public-prod'
        }
    }
};

if (userConfig) {
    config = deepExtend(config, userConfig);
    process.stdout.write('Successfully loaded custom configuration options\n');
}

module.exports = config;
