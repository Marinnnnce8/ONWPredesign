import gulp from 'gulp';
import clean from 'gulp-clean';

export default function rm(src) {
	return gulp.src(src, {
		allowEmpty: true,
		read: false,
	}).pipe(clean());
}
