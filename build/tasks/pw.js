import gulp from 'gulp';
import rename from 'gulp-rename';
import cp from '../util/cp';
import rm from '../util/rm';
import { config } from '../../package.json';

const urlTemplates = 'site/templates';

// tasks.pw
export const pw = gulp.series(
	() => cp(`${config.dist}/img/*`, `${config.pw}/${urlTemplates}/img`),
	() => cp(`${config.dist}/symbol/*`, `${config.pw}/${urlTemplates}/symbol`),
	() => cp(`${config.dist}/fonts/*`, `${config.pw}/${urlTemplates}/fonts`),
	() => cp(`${config.dist}/js/**/*`, `${config.pw}/${urlTemplates}/js`),
	() => cp(`${config.dist}/css/*.css`, `${config.pw}/${urlTemplates}/css`),
	() => rm(`${config.pw}/${urlTemplates}/css/main.min.css`),
	() => cp(`${config.src}/scss/**/*`, `${config.pw}/${urlTemplates}/css`),
	() => cp(`${config.dist}/*.html`, config.pw),
	() => cp(`${config.src}/favicon/*`, config.pw),
	() => gulp.src(`${config.src}/html/partials/**/*.hbs`)
		.pipe(rename({
			extname: '.txt'
		}))
		.pipe(gulp.dest(`${config.pw}/partials`))
);
