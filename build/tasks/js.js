import gulp from 'gulp';
import connect from 'gulp-connect';
import cp from '../util/cp';
import { config } from '../../package.json';

const dest = `${config.dist}/js`;

// tasks.js
export function js() {
	return cp(`${config.src}/js/**/*.js`, dest).pipe(connect.reload());
}

// tasks.uikitJs
export function uikitJs() {

	const src = 'node_modules/uikit/dist/js';
	const scripts = ['uikit-core'];

	// Copy components
	let path;
	config.uikit.forEach((component) => {
		path = `components/${component}`;
		scripts.push(path);
		gulp.src(`${src}/${path}.min.js`)
			.pipe(gulp.dest(`${dest}/components`));
	});

	// Copy core
	return gulp.src(`${src}/uikit-core.min.js`)
		.pipe(gulp.dest(dest));
}
