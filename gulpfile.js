var gulp    = require('gulp'),                 //基础库
    sourcemaps = require('gulp-sourcemaps'),  
    browsersync = require('browser-sync').create(),
    // sass = require('gulp-sass'),               //sass
    sass = require('gulp-ruby-sass'),
    minifyHTML = require('gulp-minify-html'), //html压缩
    minifycss = require('gulp-minify-css'),    //css压缩
    cssBase64 = require('gulp-css-base64'),
    uglify  = require('gulp-uglify'),          //js压缩
    concat  = require('gulp-concat'),          //合并文件
    clean = require('gulp-clean'),
    babel = require('gulp-babel'),            //编译es6
    Mock = require('mockjs'),
    dataTpl = require('./data/data'),          //模拟数据
    browserify = require("browserify"),        
    source = require('vinyl-source-stream'),   //虚拟流
    buffer = require('vinyl-buffer'),
    //postcss
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    color_rgba_fallback = require('postcss-color-rgba-fallback'),
    opacity = require('postcss-opacity'),
    pseudoelements = require('postcss-pseudoelements'),
    will_change = require('postcss-will-change'),
    cssnext = require('cssnext'),
    precss = require('precss');
    var processors = [
        will_change,
        autoprefixer,
        color_rgba_fallback,
        opacity,
        pseudoelements,
        cssnext,
        precss,
    ];

// HTML处理
gulp.task('html', function() {
    var opts = {
        conditionals: true,
        spare:true
    };

   var htmlSrc = './src/*.html',
       htmlDst = './build/';
 
  gulp.src(htmlSrc)
    .pipe(minifyHTML(opts))
    .pipe(gulp.dest(htmlDst));

});

// fav图标
gulp.task('favico', function() {
    var favicoSrc = './src/favicon.ico',
        favDst = './build/';

    gulp.src(favicoSrc)
        .pipe(gulp.dest(favDst));
});


// css处理
gulp.task('css', function () {
    var cssSrc = './src/css/*',
        cssDst = './build/css';

    gulp.src(cssSrc)
        .pipe(gulp.dest(cssDst))
        .pipe(minifycss())
        .pipe(gulp.dest(cssDst));
});


//sass
// gulp.task('sass',function(){
//     gulp.src('./src/scss/*.scss')
//         .pipe(sourcemaps.init())
//         .pipe(sass({includePaths: ['scss']}))
//         .pipe(sourcemaps.write('./maps'))
//         .pipe(gulp.dest('./src/css/'))
//         .pipe(browsersync.stream());
// });

gulp.task('sass', function () {
  return sass('./src/scss/*.scss', { sourcemap: true })
    .on('error', sass.logError)
    .pipe(postcss(processors))
    .pipe(cssBase64())
    // For inline sourcemaps 
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./src/css/'));
});


// 图片处理
gulp.task('img', function(){
    var imgSrc = './src/img/**/*',
        imgDst = './build/img';
    gulp.src(imgSrc)
        .pipe(gulp.dest(imgDst));
})

// js处理
// gulp.task('js', function () {
//     var jsSrc = ['./src/js/index.js'],
//         jsDst ='./src/js';

//     gulp.src(jsSrc)
//         .pipe(sourcemaps.init())
//         .pipe(babel({
//             presets: ['es2015']
//         }))
//         // .pipe(concat('all.js'))
//         //.pipe(uglify())
//         .pipe(sourcemaps.write('.'))
//         .pipe(gulp.dest(jsDst));
// });

//编译es6
gulp.task('babel', function () {
     gulp.src('./src/js/bundle.js')
        .pipe(clean());
});

//browserify
gulp.task("browserify", function () { 
 var b = browserify({ 
  entries: "./src/js/index.js", 
  debug: true 
 }); 
 
 return b.bundle() 
  .pipe(source("bundle.js")) 
  .pipe(buffer()) 
  .pipe(sourcemaps.init({loadMaps: true})) 
  .pipe(babel({
        presets: ['es2015']
   }))
  .pipe(sourcemaps.write(".")) 
  .pipe(gulp.dest("./src/js")); 
}); 

// js打包
gulp.task('copyJs', function () {
    var jsSrc = ['./src/js/bundle.js'],
        jsDst ='./build/js';

    gulp.src(jsSrc)
        .pipe(gulp.dest(jsDst));
});

// 清空build
gulp.task('clean', function() {
    gulp.src(['./build/'], {read: false})
        .pipe(clean());
});



//模拟数据
var DEVELOPMENT = true;//若false则不拦截server的数据
var createResData = function(data,status,msg){
    return {
        msg:msg||'',
        status:status||200,
        data:data || null
    }
}
// 不用F5刷新页面
gulp.task('browser-sync', function() {
    browsersync.init({
        files:['./src/**/*'],
        server: {
            baseDir: "./src/",
            middleware:[
                function(req,res,next){
                    var reg = /(?:^.+\/)*([^\.]+)\.json$/,data,tpl;
                    if(DEVELOPMENT && reg.test(req.originalUrl)){
                        data = createResData(Mock.mock(dataTpl[RegExp.$1.replace('/','')]));
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                    }else{
                        next();
                    }
                }

            ]
        },
        port:8080
    });
});


gulp.task('default', ['sass', 'browserify', 'browser-sync'], function () {
    gulp.watch("./src/scss/*.scss", ['sass']);
    gulp.watch("./src/js/index.js", ['babel','browserify']);
    gulp.watch("./src/*.html").on('change', browsersync.reload);
});


gulp.task('build',function(){
    gulp.start(['html','favico','css','img','copyJs']);
});
