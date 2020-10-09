import gulp from 'gulp';
import consolidate from 'gulp-consolidate';
import rename from 'gulp-rename';
import rm from '../util/rm';
import rp from '../util/rp';
import { config } from '../../package.json';

const scssFolder = `${config.src}/scss`;
const scssFile = 'main.scss';

// Get passed arguments
function getArgs() {
	const argv = process.argv;
	return argv.length <= 4 ? [] : [
		argv[3].replace(/-/g, '').toLowerCase(),
		argv[4].toLowerCase()
	];
}

// Get the destination of the file
function getDest(type, ext) {
	let dest = '';
	switch (type + ext) {
		case 'chbs':
		case 'mhbs':
			dest += 'html/partials/components';
			break;
		case 'cscss':
		case 'mscss':
			dest += 'scss/components';
			break;
		default:
			dest += 'html';
			break;
	}
	return `${config.src}/${dest}`;
}

// Get the name of the file
function getName(name, ext) {
	return (ext === 'scss' ? '_' : '') + `${name}.${ext}`;
}

// Get the scss import string
function getScssImport(name) {
	return `@import 'components/${name}';\n`;
}

// Is a component being created?
function isComponent(type) {
	return type === 'c' || type === 'm';
}

// Create File(s)
export function cf(cb) {

	const args = getArgs();
	if (!args.length) cb();

	const type = args[0];
	const name = args[1];

	// Create a file
	const create = (ext) => {
		return gulp.src(`build/tpl/${isComponent(type) ? 'partial' : 'template'}-${ext}.txt`)
			.pipe(consolidate('lodash', {
				name: name
			}))
			.pipe(rename(getName(name, ext)))
			.pipe(gulp.dest(getDest(type, ext)));
	};

	create('hbs');
	if (isComponent(type)) {
		create('scss');
		// Add scss import to main.scss
		const anchor = '// +++';
		return rp(scssFolder, scssFile, anchor, getScssImport(name) + anchor);
	}

	cb();
}

// Remove file(s)
export function rf(cb) {

	const args = getArgs();
	if (!args.length) cb();

	const type = args[0];
	const name = args[1];

	// Remove a file
	const remove = (ext) => rm(`${getDest(type, ext)}/${getName(name, ext)}`);

	remove('hbs');
	if (isComponent(type)) {
		remove('scss');
		// Remove scss import from main.scss
		return rp(scssFolder, scssFile, getScssImport(name));
	}

	cb();
}
