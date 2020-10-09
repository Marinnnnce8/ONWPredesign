import gulp from 'gulp';
import imagemin from 'gulp-imagemin';
import svgSprite from 'gulp-svg-sprite';
import { config } from '../../package.json';

function createSprite() {
	return gulp.src(`${config.src}/icons/*.svg`)
		.pipe(imagemin([ // @todo can settings be improved?
			imagemin.svgo({
				plugins: [
					{removeViewBox: false}
				]
			})
		]))
		.pipe(svgSprite({
			mode: {
				symbol: {
					sprite: 'icons.svg'
				},
			},
			svg: {
				namespaceClassnames: false
			}
		}))
		.pipe(gulp.dest(config.dist));
}

// tasks.icons
export const icons = createSprite;
