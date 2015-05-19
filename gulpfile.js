//var jadeDir     = "partials",
//    sassDir     = './sass',
//    homeDir     = "./",
//    jsDir       = "js",
//    gulp        = require('gulp'),
//    jade        = require('gulp-jade'),
//    notify      = require('gulp-notify'),
//    sass        = require('gulp-ruby-sass'),
//    livereload  = require('gulp-livereload'),
//    browserify  = require('gulp-browserify'),
//    rename      = require('gulp-rename'),
//    uglify      = require('gulp-uglifyjs'),
//    shell       = require('gulp-shell'),
//    argv        = require('yargs').argv;
//
//
//
//
//
//gulp.task('push', shell.task(['git add -A && git commit -m "' + argv.m + '" && git push']));
//
//gulp.task('jade', function () {
//  return gulp.src(jadeDir + "/**/*.jade")
//      .pipe(jade())
//      .pipe(gulp.dest(homeDir))
//      .pipe(livereload())
//    .pipe(notify('Jade has been compiled. '));
//});
//
//gulp.task('sass', function() {
//    return sass("./sass")
//        .pipe(gulp.dest('css'))
//        .pipe(notify('Sass has been compiled.'));
//});
//
//gulp.task('js', function(){
//    gulp.src('js/app.js')
//        .pipe(browserify())
//        .pipe(rename('/bundle.js'))
//        .pipe(gulp.dest('./js'))
//        .pipe(notify('JS has been bundled.'));
//});
//
//gulp.task('uglify', function() {
//  gulp.src('js/bundle.js')
//    .pipe(uglify())
//    .pipe(rename('bundle.min.js'))
//    .pipe(gulp.dest('js'))
//});
//
//gulp.task('watch', function() {
//  var server = livereload();
//
//  gulp.watch(jadeDir + "/**/*.jade", ['jade']).on('change', function(file) {
//      server.changed(file.path);
//  });
//
//  gulp.watch(sassDir + "/*.scss", ['sass']).on('change', function(file) {
//      server.changed(file.path);
//  });
//
//  gulp.watch(jsDir + "/**/*.js", ['js']).on('change', function(file) {
//      server.changed(file.path);
//  });
//
//  gulp.watch(jsDir + "/**/*.js").on('change', function(file) {
//      server.changed(file.path);
//  });
//});
//
//gulp.task('serve', ['jade','js','uglify','sass', 'watch']);





























var gulp        = require("gulp"),
    sass        = require("gulp-ruby-sass"),
    filter      = require('gulp-filter'),
    notify      = require('gulp-notify'),
    jade        = require('gulp-jade'),
    uglify      = require('gulp-uglify'),
    sourcemaps  = require('gulp-sourcemaps'),
    gutil       = require('gulp-util'),
    source      = require('vinyl-source-stream'),
    buffer      = require('vinyl-buffer'),
    rename      = require('gulp-rename'),
    browserify  = require('browserify'),
    plumber     = require('gulp-plumber'),
    tap         = require('gulp-tap'),
    streamify   = require('gulp-streamify'),
    gulpif      = require('gulp-if');

gulp.task('push', shell.task(['git add -A && git commit -m "' + argv.m + '" && git push']));

var browserSync = require("browser-sync").create();
var reload = browserSync.reload;
var isDebug = true;

// Static Server + watching scss/html files
gulp.task('serve', ['sass'], function() {

    browserSync.init({
        server: "./"
    });

    gulp.watch("scss/*.scss", ['sass']);
    gulp.watch("partials/*.jade", ['jade-watch']);
    gulp.watch("js/**/*.js", ['js-watch']);
    gulp.watch("app/*.html").on('change', reload);
});

gulp.task('js-watch', ['js'], reload);
gulp.task('jade-watch', ['jade'], reload);


function handleError(err) {
    notify('Error ');
    gutil.log(
        gutil.colors.red("Browserify compile error:"),
        err.message,
        "\n\t",
        gutil.colors.cyan("in file"),
        file.path
    );
    this.emit('end');

}


gulp.task('js', function() {
    var b = browserify({
        entries: "js/app.js",
        debug: true
    });

    return gulp.src('js/app.js')
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
        .pipe(gulp.dest("dist/js"))
        .pipe(reload({stream: true}));
});

gulp.task('jade', function () {
  return gulp.src("partials/**/*.jade")
      .pipe(jade())
      .pipe(gulp.dest('./'))
      .pipe(notify('Jade has been compiled.'));
});

gulp.task('sass', function () {
    return sass('scss/app.scss', {style: 'expanded', sourcemap: true})
        .pipe(gulp.dest('css'))// Write the CSS & Source maps
        .pipe(filter('**/*.css')) // Filtering stream to only css files
        .pipe(browserSync.reload({stream:true}));
});


