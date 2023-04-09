const { src, dest, series } = require("gulp");
const del = require("delete");
const zip = require("gulp-zip");

function clean(cb) {
  return del("dist/**", { force: true });
}

function build(cb) {
  return src(
    [
      "css/**/*",
      "images/**/*",
      "scripts/**/*",
      "background.js",
      "LICENSE.md",
      "manifest.json",
      "README.md",
    ],
    { base: "." }
  )
    .pipe(dest("dist"))
    .pipe(zip("hellofresh-chrome-helper-dist.zip"))
    .pipe(dest("."));
}

exports.build = build;
exports.default = series(clean, build);
