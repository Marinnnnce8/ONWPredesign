import gulp from 'gulp';
import connect from 'gulp-connect';
import consolidate from 'gulp-consolidate';
import cssnano from 'gulp-cssnano';
import csso from 'gulp-csso';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import lint from 'gulp-sass-lint';
import cp from '../util/cp';
import { config } from '../../package.json';

const src = `${config.src}/scss`;
const dest = `${config.dist}/css`;

// Compile main.scss
function compileMain() {
	return gulp.src([`${src}/main.scss`])
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(rename('main.min.css'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(dest))
		.pipe(connect.reload());
}

// Compile UIkit SCSS
function compileUIkit() {
	return gulp.src('build/tpl/uikit-theme-scss.txt')
		.pipe(consolidate('lodash', {
			src: src,
			uikit: '../../node_modules/uikit/src/scss'
		}))
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(csso())
		.pipe(cssnano({zindex: false}))
		.pipe(rename('uikit-theme.min.css'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(dest))
		.pipe(connect.reload());
}

// Copy any CSS files
function cpCss() {
	return cp(`${config.src}/css/**/*.css`, dest);
}

// tasks.css
export const css = gulp.series(compileUIkit, compileMain, cpCss);

// tasks.sasslint
export function sasslint() {
	return gulp.src([`${src}/**/*.scss`])
		.pipe(lint({
			build: '.sass-lint.yml'
		}))
		.pipe(lint.format())
		.pipe(lint.failOnError());
}
