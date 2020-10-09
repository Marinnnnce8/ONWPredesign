import gulp from 'gulp';
import replace from 'gulp-replace';

export default function rp(path, filename, string, replacement = '') {
	return gulp.src(`${path}/${filename}`)
		.pipe(replace(string, replacement))
		.pipe(gulp.dest(path));
}
