var gulp = require('gulp');

// instantiate the helpers
var concat = require('gulp-concat');
var cleanCSS = require('gulp-clean-css');
var CacheBuster = require('gulp-cachebust');
var cachebust = new CacheBuster();
var fs = require('fs');
var rimraf = require('rimraf');
var through = require('through2');
var path = require('path');

// list of files source for the task
var css_files = [
    'css/base.css',
    'css/dark-theme.css',
    'css/layout.css',
    'css/module.css',
    'css/state.css'
];

// the tasks
checkFiles(css_files);
gulp.task('css_build', function () {
    return gulp.src(css_files)	// the source
        .pipe(cleanCSS())
        .pipe(concat('all.css'))	// concat
        .pipe(cachebust.resources())
        .pipe(gulp.dest('css'))	// output to this folder
});

gulp.task('css_bust', ['css_build'], function () {
    return gulp.src('templates/index.html')
        .pipe(cachebust.references())
        .pipe(gulp.dest('./'));
});

gulp.task('css', ['css_bust'], function () {
    return gulp.src(['./css/all.*.css'], {read: false})
        .pipe(myRevOutdated(1)) // leave 1 latest asset file
        .pipe(cleaner());
});

//===== watch
gulp.task('watch', function (event) {
    var csswatcher = gulp.watch(css_files, ['css']);
    csswatcher.on('change', function (event) {
        console.log('Event path: ' + event.path + ':' + event.type);
    });
});

//===== utils
function checkFiles(pathsList) {

    var totPaths = pathsList.length;
    for (var i = 0; i < totPaths; i++) {
        var path = pathsList[i];
        fs.stat(path, function (err, stat) {
            if (err != null) {
                console.log("ERROR ON PATH: '" + err.path + "' ----> " + err.code);
            }
        });
    }
}

function cleaner() {
    return through.obj(function(file, enc, cb){
        rimraf( path.resolve( (file.cwd || process.cwd()), file.path), function (err) {
            if (err) {
                this.emit('error', new gutil.PluginError('Cleanup old files', err));
            }
            this.push(file);
            cb();
        }.bind(this));
    });
}

function myRevOutdated(keepQuantity) {

    'use strict';
    keepQuantity = parseInt(keepQuantity) || 2;
    var lists = {};

    return through.obj(function (file, enc, cb) {
        var regex = new RegExp('^(.*)\.[0-9a-f]{8,10}(?:\\.min)?\\' + path.extname(file.path) + '$');
        if (regex.test(file.path)) {
            var identifier = regex.exec(file.path)[1] + path.extname(file.path);
            if (lists[identifier] === undefined) {
                lists[identifier] = [];
            }
            lists[identifier].push({
                file: file,
                time: file.stat.ctime.getTime()
            });
        }
        cb();
    }, function (cb) {
        Object.keys(lists).forEach(function (identifier) {
            lists[identifier].sort(function (a, b) {
                return b.time - a.time;
            })
                .slice(keepQuantity)
                .forEach(function (f) {
                    this.push(f.file);
                }, this);
        }, this);
        cb();
    });
}