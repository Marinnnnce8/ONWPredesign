import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import connect from 'gulp-connect';
import data from 'gulp-data';
import handlebars from 'gulp-compile-handlebars';
import prettify from 'gulp-html-prettify';
import rename from 'gulp-rename';
import rm from '../util/rm';
import { config } from '../../package.json';

const src = `${config.src}/html`;
const srcPartials = `${src}/partials`;

// Remove all HTML files from dist
function rmHtml() {
	return rm(`${config.dist}/*.html`);
}

// Convert data to base64
function base64(data) {
	if (typeof data === 'object') data = JSON.stringify(data);
	return Buffer.from(data).toString('base64');
}

// Equivalent of NbWire::jsonRender();
function jsonRender(data) {

	if (!(typeof data === 'object')) return '';

	const items = {};
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			if (Array.isArray(data[key])) {
				items[key] = data[key];
				delete data[key];
			}
		}
	}
	data.renderData = base64(items);

	if (!('config' in data)) {
		data.config = {};
	}

	if (!('cta' in data.config)) {
		data.config.cta = 'Find out more';
	}

	return JSON.stringify(data);
}

// Compile Handlebars Templates
export function compileHandlebars() {
	return gulp.src(`${src}/*.hbs`)
		.pipe(data((file) => {

			// The object returned here is merged with the object passed to handlebars

			// Get root data
			let obj = {};
			try {
				obj = JSON.parse(fs.readFileSync(`${src}/data/index.json`));
			} catch(e) {
				// Do nothing
			}

			const name = path.basename(file.path, '.hbs');

			// Get the default title from the name
			const parts = name.split('-');
			let word;
			for (let i = 0; i < parts.length; i++) {
				word = parts[i];
				parts[i] = word.charAt(0).toUpperCase() + word.slice(1);
			}
			const title = parts.join(' ');

			// page/template specific
			obj.page = {
				h1: title,
				meta_title: name === 'home' ?
					`${obj.nb.siteName} | ${title}` :
					`${title} | ${obj.nb.siteName}`,
				name: name,
				title: title,
				template: {name: name}
			};

			// Find custom data in .json file
			try {
				const custom = JSON.parse(fs.readFileSync(`${src}/data/${name}.json`));
				for (const prop in custom) {
					if (custom.hasOwnProperty(prop)) {
						obj.page[prop] = custom[prop];
					}
				}
			} catch(e) {
				// Do nothing
			}

			// Load components
			obj.loadComponents = base64({
				path: './js/components/',
				components: config.nbkit.concat(config.uikit),
			});

			// Helpers
			obj.aws = 'https://aws.nbcommunication.com/';
			obj.blankPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
			obj.logo = './img/logo.png';
			obj.year = (new Date()).getFullYear();

			return obj;
		}))
		.pipe(handlebars({}, {
			ignorePartials: true,
			batch: [
				srcPartials,
				`${srcPartials}/components`,
				`${srcPartials}/nb`,
				`${srcPartials}/render`,
				`${srcPartials}/templates`,
				`${srcPartials}/uikit`,
			],
			helpers: {
				base64: base64,
				default: (a, b) => a ? a : b,
				eq: (a, b) => a === b,
				gte: (a, b) => (a ? parseInt(a) : 0) >= (b ? parseInt(b) : 0),
				ida: (str) => String(str).toLowerCase().replace(/\s/g, ''),
				jsonRender: jsonRender,
				lte: (a, b) => (a ? parseInt(a) : 0) <= (b ? parseInt(b) : 0),
				neq: (a, b) => a !== b,
			}
		}))
		.pipe(rename({
			extname: '.html'
		}))
		.pipe(prettify({
			indent_char: "\t", // eslint-disable-line
			indent_size: 1
		}))
		.pipe(gulp.dest(config.dist))
		.pipe(connect.reload());
}

// tasks.html
export const html = gulp.series(rmHtml, compileHandlebars);
