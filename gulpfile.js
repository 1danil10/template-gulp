const { src, dest } = require("gulp"),
  gulp = require("gulp");
const browserSync = require("browser-sync").create();
const fileInclude = require("gulp-file-include");
const del = require("del");
const scss = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const groupMediaQueries = require("gulp-group-css-media-queries");
const cleanCss = require("gulp-clean-css");
const rename = require("gulp-rename");
const uglify = require("gulp-uglify-es").default;
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const webpHTML = require("gulp-webp-html");
const webpCSS = require("gulp-webp-css");
const svgSprite = require("gulp-svg-sprite");
const ttf2woff = require("gulp-ttf2woff");
const ttf2woff2 = require("gulp-ttf2woff2");

const fs = require("fs");

const projectFolder = "dist";
//const projectFolder = require("path").basename(__dirname); name equal to directory project
const sourceFolder = "#src";

const path = {
  build: {
    html: projectFolder + "/",
    css: projectFolder + "/css/",
    js: projectFolder + "/js/",
    img: projectFolder + "/assets/images/",
    icons: projectFolder + "/assets/icons/",
    fonts: projectFolder + "/assets/fonts/",
  },
  src: {
    html: [
      sourceFolder + "/**/*.html",
      "!" + sourceFolder + "/partials/*.html",
    ],
    scss: sourceFolder + "/scss/style.scss",
    js: sourceFolder + "/js/main.js",
    img: sourceFolder + "/assets/images/**/*.{jpg,png,gif,ico,webp,svg}",
    icons: sourceFolder + "/assets/icons/**/*.svg",
    fonts: sourceFolder + "/assets/fonts/**/*.{ttf, eot, woff, woff2, svg}",
  },
  watch: {
    html: sourceFolder + "/**/*.html",
    scss: sourceFolder + "/scss/**/*.scss",
    js: sourceFolder + "/js/**/*.js",
    img: sourceFolder + "/assets/images/**/*.{jpg,png,gif,ico,webp,svg}",
    icons: sourceFolder + "/assets/icons/**/*.svg",
  },
  clean: "./" + projectFolder + "/",
};

function bsControl(params) {
  browserSync.init({
    server: {
      baseDir: "./" + projectFolder + "/",
    },
    port: 3000,
    notify: false,
    injectChanges: true,
  });
}

function clean() {
  return del(path.clean);
}

function watchFiles() {
  gulp.watch([path.watch.html], handleHTML);
  gulp.watch([path.watch.scss], handleSCSS);
  gulp.watch([path.watch.js], handleJS);
  gulp.watch([path.watch.img], handleImages);
  //icons
}

function handleHTML() {
  return src(path.src.html)
    .pipe(fileInclude())
    .pipe(webpHTML())
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream());
}
function handleSCSS() {
  return src(path.src.scss)
    .pipe(
      scss({
        outputStyle: "expanded",
      }),
    )
    .pipe(groupMediaQueries())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 versions"],
        cascade: true,
      }),
    )
    .pipe(webpCSS())
    .pipe(dest(path.build.css))
    .pipe(cleanCss())
    .pipe(
      rename({
        extname: ".min.css",
      }),
    )
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream());
}

function handleJS() {
  return src(path.src.js)
    .pipe(fileInclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: ".min.js",
      }),
    )
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream());
}

function handleImages() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70,
      }),
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3, // 0 to 7
      }),
    )
    .pipe(dest(path.build.img))
    .pipe(browserSync.stream());
}

function handleFonts() {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));
  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

function fontsStyle(params) {
  let file_content = fs.readFileSync(sourceFolder + "/scss/base/fonts.scss");
  if (file_content == "") {
    fs.writeFile(sourceFolder + "/scss/base/fonts.scss", "", cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(
              sourceFolder + "/scss/base/fonts.scss",
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb,
            );
          }
          c_fontname = fontname;
        }
      }
    });
  }
}

function cb() {}

gulp.task("svgSprite", function () {
  return src(path.src.icons)
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "icons.svg",
            example: true,
          },
        },
      }),
    )
    .pipe(dest(path.build.icons));
});

let build = gulp.series(
  clean,
  gulp.parallel(handleHTML, handleSCSS, handleJS, handleImages, handleFonts),
  fontsStyle,
);
const watch = gulp.parallel(build, svgSprite, watchFiles, bsControl);

exports.fontsStyle = fontsStyle;
exports.handleFonts = handleFonts;
exports.handleImages = handleImages;
exports.handleJS = handleJS;
exports.handleSCSS = handleSCSS;
exports.handleHTML = handleHTML;
exports.build = build;
exports.watch = watch;
exports.default = watch;
