import gulp from 'gulp';
import connect from 'gulp-connect';
import * as tasks from './build/tasks';
import rm from './build/util/rm';
import { config } from './package.json';

// Build
export const build = gulp.series(
	tasks.uikitJs,
	tasks.assets,
	tasks.icons,
	tasks.html,
	tasks.css,
	tasks.js
);

// Build and watch
export const dev = gulp.series(
	(cb) => { // Watch
		gulp.watch(`${config.src}/icons/*.svg`, gulp.series(tasks.icons, tasks.html));
		gulp.watch([`${config.src}/html/**/*.hbs`, `${config.src}/html/data/*.json`], gulp.series(tasks.compileHandlebars));
		gulp.watch(`${config.src}/scss/**/*.scss`, gulp.series(tasks.css, tasks.sasslint));
		gulp.watch(`${config.src}/js/**/*.js`, gulp.series(tasks.js));
		cb();
	},
	(cb) => { // Server
		connect.server({
			root: config.dist,
			livereload: true
		});
		cb();
	}
);

// Reset
export const reset = gulp.series(
	// Remove dist folder
	() => rm(config.dist),
	// Remove pw folder
	() => rm(config.pw)
);

// Create File
export const cf = tasks.cf;

// Remove file
export const rf = tasks.rf;

// Prepare files for PW development
export const pw = tasks.pw;

// Release
export const release = gulp.series(
	reset,
	build,
	pw
);
