var gulp        = require("gulp"),
    sass        = require("gulp-ruby-sass"),
    filter      = require('gulp-filter'),
    notify      = require('gulp-notify'),
    jade        = require('gulp-jade'),
    uglify      = require('gulp-uglifyjs'),
    sourcemaps  = require('gulp-sourcemaps'),
    gutil       = require('gulp-util'),
    source      = require('vinyl-source-stream'),
    buffer      = require('vinyl-buffer'),
    rename      = require('gulp-rename'),
    browserify  = require('browserify'),
    plumber     = require('gulp-plumber'),
    tap         = require('gulp-tap'),
    streamify   = require('gulp-streamify'),
    gulpif      = require('gulp-if'),
    shell       = require('gulp-shell'),
    argv        = require('yargs').argv,
    browserSync = require("browser-sync").create(),
    reload      = browserSync.reload,
    inject      = require('gulp-inject');

var isDebug = true; //uncomment for dev
var homeDir = './';

var paths = {
    homeDir: '/',
    jade: {
        loc: "partials/**/*.jade",
        dest: homeDir
    },
    sass: {
        loc: "scss/**/*.scss",
        dest: "css",
        sassFile: "scss/app.scss"
    },
    js: {
        loc: "js/**/*.js",
        dest: "dist/js",
        entry: "js/app.js"
    },
    inject: {
        jadeIndex: "partials/index.jade",
        js: "dist/js/**/*.js",
        css: "css/**/*.css"
    }
};

gulp.task('push', shell.task(['git add -A && git commit -m "' + argv.m + '" && git push']));

gulp.task('serve', ['sass', 'js', 'jade'], function() {
    browserSync.init({
        server: "./"
    });
    gulp.watch(paths.sass.loc, ['sass']);
    gulp.watch(paths.jade.loc,['jade']);
    gulp.watch(paths.js.loc, ['js', 'inject', 'jade']);
});

gulp.task('js', function() {
    var b = browserify({
        entries: paths.js.entry,
        debug: true
    });

    return gulp.src(paths.js.entry)
        .pipe(plumber())
        .pipe(tap(
            function (file) {
                var d = require('domain').create();
                d.on("error",
                    function (err) {
                        gutil.log(gutil.colors.red("Browserify compile error:"), err.message, "\n\t", gutil.colors.cyan("in file"), file.path);
                        gutil.beep();
                    }
                );

                d.run(function () {
                    file.contents = browserify({
                        entries: [file.path],
                        debug: isDebug
                    }).bundle();
                });
            }
        ))
        .pipe(gulpif(!isDebug, streamify(uglify({
            compress: true
        }))))
        .pipe(rename('bundle.js'))
        .pipe(gulp.dest(paths.js.dest))
        .pipe(reload({stream: true}));
});

gulp.task('jade', ['inject'], function () {
  return gulp.src(paths.jade.loc)
      .pipe(jade())
      .pipe(gulp.dest(paths.jade.dest))
      .pipe(notify('Jade has been compiled.'));
});

gulp.task('inject', ['js','sass'], function() {
    var target = gulp.src(paths.inject.jadeIndex);
    var sources = gulp.src([paths.inject.js, paths.inject.css], {read: false});

    return target.pipe(inject(sources))
        .pipe(gulp.dest('partials'));
});

gulp.task('sass', function () {
    return sass(paths.sass.sassFile, {style: 'expanded', sourcemap: true})
        .pipe(gulp.dest(paths.sass.dest))// Write the CSS & Source maps
        .pipe(filter('**/*.css')) // Filtering stream to only css files
        .pipe(browserSync.reload({stream:true}));
});