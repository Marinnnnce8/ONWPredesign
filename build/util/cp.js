import gulp from 'gulp';

export default function cp(src, dest) {
	return gulp.src(src).pipe(gulp.dest(dest));
}
