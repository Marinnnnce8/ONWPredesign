/**
 * NBkit
 *
 * This is the version prior to release of the NBkit package
 *
 * @version 0.4.0
 * @author Chris Thomson
 * @copyright 2020 NB Communication Ltd
 *
 */

if (typeof UIkit === 'undefined') {
	throw new Error('NBkit requires UIkit. UIkit must be included before this script.');
}

var uk = UIkit.util;

(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('nb', factory) :
	(global = global || self, global.NBkit = factory());
}(this, function() { 'use strict';

	/**
	 * Javascript Promise
	 *
	 */
	var Promise = 'Promise' in window ? window.Promise : uk.Promise;

	/**
	 * Can the Storage API be used?
	 *
	 */
	var hasStorage = 'localStorage' in window && 'sessionStorage' in window;

	/**
	 * Object.values
	 *
	 */
	if (!Object.values) {
		Object.values = function(obj) {
			return Object.keys(obj).map(function(key) {
				return obj[key];
			});
		};
	}

	/**
	 * Cookie Consent Settings
	 *
	 */
	var nbCookie = {callbacks: {}, settings: {}};

	/**
	 * Perform an asynchronous request
	 *
	 * @param {string} [url]
	 * @param {Object} [options]
	 * @return {Promise}
	 *
	 */
	function ajax(url, options) {

		profilerStart('nb.ajax');

		if (!url) url = [location.protocol, '//', location.host, location.pathname].join('') + '?ajax=1';
		if (options === void 0 || !uk.isPlainObject(options)) options = {};

		if (uk.includes(url, '#')) {
			// Make sure # comes after ?
			var x = url.split('#');
			var y = x[1].split('?');
			url = x[0] + (y.length > 1 ? '?' + y[1] : '') + '#' + y[0];
		}

		options = uk.assign({
			headers: {'X-Requested-With': 'XMLHttpRequest'},
			method: 'GET',
			responseType: 'json'
		}, options);

		return new Promise(function(resolve, reject) {
			uk.ajax(url, options).then(function(xhr) {
				var response = getRequestResponse(xhr);
				profilerStop('nb.ajax');
				if (!response.status) {
					reject(response);
				} else {
					resolve(response);
				}
			}, function(e) {
				profilerStop('nb.ajax');
				reject(getRequestResponse(e.xhr, e.status, e));
			});
		});
	}

	/**
	 * Return html attributes as a rendered string
	 *
	 * @return {string}
	 *
	 */
	function attr() {

		var attrs = {};
		var tag = '';
		var close = false;

		// Get and set arguments provided
		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (uk.isBoolean(arg)) {
				close = arg;
			} else if (uk.isString(arg) && arg) {
				tag = arg;
			} else if (uk.isArray(arg) && arg.length) {
				if (!('class' in attrs)) attrs.class = [];
				if (!uk.isArray(attrs.class)) attrs.class = [attrs.class];
				for (var n = 0; n < arg.length; n++) attrs.class.push(arg[n]);
				tag = 'div';
			} else if (uk.isPlainObject(arg)) {
				attrs = uk.assign(attrs, arg);
			}
		}

		var attributes = [];
		for (var key in attrs) {
			if (uk.hasOwn(attrs, key)) {
				var value = attrs[key];
				switch (key) {
					case 'element':
					case 'nodeName':
					case 'tag':
						// If `tag` is passed in attrs
						// and a tag has not been passed
						// make it the tag
						if (!tag) tag = value;
						break;
					case 'close':
						// If `close` is passed in attrs
						// set this as the close value
						close = uk.toBoolean(value);
						break;
					default:
						if (value !== false) {
							if (key) key = uk.hyphenate(key);
							if (value === '' || uk.isBoolean(value)) {
								attributes.push(key);
							} else {
								value = attrValue(value);
								attributes.push(key ? key + '="' + value + '"' : value);
							}
						}
						break;
				}
			}
		}

		attributes = attributes.join(' ');
		attributes = attributes ? ' ' + attributes : '';
		if (tag) tag = tag.replace(/<|>|\//gi, '');

		return tag ? '<' + tag + attributes + '>' + (close ? '</' + tag + '>' : '') : attributes;
	}

	/**
	 * Convert a value to an html attribute value
	 *
	 * @param {*} value The value to process.
	 * @return {string}
	 *
	 */
	function attrValue(value) {
		if (uk.isArray(value)) {
			value = value.join(' ');
		} else if (uk.isPlainObject(value)) {
			var attrValue = [];
			var val;
			for (var key in value) {
				if (uk.hasOwn(value, key)) {
					val = value[key];
					if (uk.isPlainObject(val)) break;
					if (uk.isBoolean(val)) val = val ? 'true' : 'false';
					key = uk.hyphenate(key);
					attrValue.push(key + ': ' + val);
				}
			}
			value = Object.keys(value).length === attrValue.length ? attrValue.join('; ') : JSON.stringify(value);
		}
		return value;
	}

	/**
	 * Decode a value from Base64
	 *
	 * @param {*} value The value to decode.
	 * @param {string} [delimiter] If specified, the string will be split into an array.
	 * @return {(string | Object | Array)}
	 *
	 */
	function base64_decode(value, delimiter) {
		try {
			value = atob(value);
			value = data(value, '', false, delimiter);
		} catch (e) {
			value = '';
		}
		return value;
	}

	/**
	 * Encode a value to Base64
	 *
	 * @param {*} value The value to encode.
	 * @param {string} [delimiter] An array value will be joined by this (default='').
	 * @return {string}
	 *
	 */
	function base64_encode(value, delimiter) {
		if (delimiter === void 0) delimiter = '';
		if (uk.isArray(value)) value = value.join(delimiter);
		if (uk.isPlainObject(value)) value = JSON.stringify(value);
		return btoa(value);
	}

	/**
	 * Handles cookie consent settings.
	 *
	 * @param {(string | boolean)} key The cookie setting name.
	 * @param {(number | boolean | string | callable)} value The value to set or a listener function.
	 * @return {(number | null)}
	 *
	 */
	function cookieConsent(key, value) {
		if (key === void 0) return nbCookie.settings;
		if (uk.isBoolean(key)) {
			value = key;
			for (var k in nbCookie.settings) {
				if (uk.hasOwn(nbCookie.settings, k)) {
					cookieConsent(k, value ? value : nbCookie.settings[k]);
				}
			}
		} else {
			if (!(key in nbCookie.settings)) return null;
			if (uk.isFunction(value)) {
				if (!(key in nbCookie.callbacks)) {
					nbCookie.callbacks[key] = [];
				}
				nbCookie.callbacks[key].push(value);
			} else if (!uk.isUndefined(value)) {
				if (uk.isNumeric(value)) value = parseInt(value);
				if (uk.isString(value)) value = value.toLowerCase() === 'yes' ? 1 : 0;
				if (uk.isBoolean(value)) value = value ? 1 : 0;
				nbCookie.settings[key] = value;
				if (hasStorage) {
					localStorage.setItem('nbCookie', JSON.stringify(nbCookie.settings));
				}
				if (key in nbCookie.callbacks) {
					nbCookie.callbacks[key].forEach(function(callback) {
						callback.call(null, nbCookie.settings[key]);
					});
				}
			}
		}
		return nbCookie.settings[key];
	}

	/**
	 * Data
	 *
	 * @param {(string | HTMLElement)} value The string to parse, or the element to retrieve data from.
	 * @param {string} [key] The data-* attribute key/name.
	 * @param {boolean} [base64]
	 * @param {string} [delimiter]
	 * @return {(string | Object | Array)} Should the retrieved value be decoded from Base64?
	 *
	 */
	function data(value, key, base64, delimiter) {

		if (uk.isPlainObject(value)) return value;

		var el;
		if (uk.isNode(value)) {
			el = value;
			value = key ? uk.data(el, key) : '';
		}
		if (base64) {
			if (el) {
				['', 'data-'].forEach(function(prefix) {
					var name = prefix + key;
					if (uk.hasAttr(el, name)) {
						uk.removeAttr(el, name);
					}
				});
			}
			return value ? base64_decode(value, delimiter) : {};
		}

		if (delimiter && uk.includes(value, delimiter)) {
			value = value.split(delimiter);
		} else {
			try {
				value = uk.parseOptions(value);
			} catch (e) {
				if (key && uk.includes(value, key)) {
					value = value.split(key);
				}
			}
		}

		return value;
	}

	/**
	 * Debounce
	 *
	 * @param {Function} func The function to limit.
	 * @param {number} [wait] The time (ms) to wait between fires.
	 * @param {boolean} [immediate] Trigger the function on the leading edge, instead of the trailing.
	 * @return {Function}
	 *
	 */
	function debounce(func, wait, immediate) {

		var timeout;
		if (wait === void 0) wait = NBkit.options.duration;
		return function() {

			var this$1 = this;
			var args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(this$1, args);
			};
			var callNow = immediate && !timeout;

			clearTimeout(timeout);
			timeout = setTimeout(later, wait);

			if (callNow) func.apply(this$1, args);
		};
	}

	/**
	 * Get a class name
	 *
	 * @param {(Object | string)} item
	 * @return {string}
	 *
	 */
	function getClassName(item) {
		if (uk.isPlainObject(item)) {
			if ('$options' in item) {
				item = item.$options.name;
			} else {
				var infer = ['name', 'title'];
				var key;
				for (var i = 0; i < infer.length; i++) {
					key = infer[i];
					if (key in item) {
						item = item[key];
						break;
					}
				}
			}
		}
		return uk.isString(item) ? uk.hyphenate(item).replace(/\s+/g, '-') : '';
	}

	/**
	 * Get the previous sibling, with optional selector
	 *
	 * @param {HTMLElement} el The element to get the previous sibling of.
	 * @param {string} [selector] An optional selector.
	 *
	 */
	function getPreviousSibling(el, selector) {

		// Get the previous sibling element
		var sibling = el.previousElementSibling;

		// If there's no selector, return the first sibling
		if (!uk.isString(selector)) return sibling;

		// If the sibling matches our selector, use it
		// If not, jump to the next sibling and continue the loop
		while(sibling) {
			if (sibling.matches(selector)) return sibling;
			sibling = sibling.previousElementSibling;
		}
	}

	/**
	 * Process an XHR response and return data
	 *
	 * @param {Object} xhr
	 * @param {number} [status]
	 * @param {*} [fallback]
	 * @return {Object}
	 *
	 */
	function getRequestResponse(xhr, status, fallback) {

		if (status === void 0 || !uk.isNumber(status)) {
			if (uk.isString(status)) fallback = status;
			status = 500;
		}
		if (xhr.status) status = xhr.status;
		if (fallback === void 0) fallback = null;

		var response = xhr.response;
		if (!uk.isPlainObject(response)) {
			try {
				response = JSON.parse(response);
			} catch (e) {
				if (!fallback) fallback = response;
			}
		}

		if (uk.isPlainObject(response)) {
			if ('errors' in response) {
				response = getResponseErrors(response.errors);
				if (status < 400) status = 0;
			} else if ('data' in response) {
				response = response.data;
			}
		} else {
			response = fallback;
			status = 500;
		}

		return {status: parseInt(status), response: response};
	}

	/**
	 * Parse response errors
	 *
	 * @param {Object} e
	 * @return {Array}
	 *
	 */
	function getResponseErrors(e) {
		var errors = [];
		for (var i = 0; i < e.length; i++) {
			errors.push(e[i].message);
		}
		return errors;
	}

	/**
	 * Perform an asynchronous request to a GraphQL API endpoint
	 *
	 * @param {string} query The GraphQL query.
	 * @param {Object} [variables] Additional `key:value` variables.
	 * @return {Promise}
	 *
	 */
	function graphql(query, variables) {
		var data = {query: query};
		if (uk.isPlainObject(variables)) data.variables = variables;
		return ajax(NBkit.options.graphql, {
			data: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				'X-Requested-With': 'XMLHttpRequest'
			},
			method: 'POST'
		});
	}

	/**
	 * Render an image
	 *
	 * @param {(string | Object)} image The image to render.
	 * @param {(Object | string)} [attrs] Attributes for the tag. If a string is passed the alt attribute is set.
	 * @param {Object} [options] Options to modify behaviour.
	 * @return {string}
	 *
	 */
	function img(image, attrs, options) {

		// Shortcuts
		if (uk.isString(attrs)) attrs = {alt: attrs};
		if (attrs === void 0) attrs = {};
		if (options === void 0) options = {};

		// Set default options
		options = uk.assign({
			focus: false,
			tag: 'img',
			ukImg: true,
			src: 'url'
		}, options);

		var isImg = options.tag === 'img';
		var focus = {left: 50, top: 50};
		var srcset = false;
		var sizes = false;

		if (uk.isPlainObject(image)) {
			if (image.focus && uk.isPlainObject(image.focus)) focus = uk.assign(focus, image.focus);
			if (image.srcset) srcset = image.srcset;
			if (image.sizes && image.srcset) sizes = image.sizes;
			image = image[options.src];
		}

		// Set default img attributes
		attrs = uk.assign({
			alt: '',
			width: 0,
			height: 0
		}, attrs);

		// If no image has been passed or nothing found
		if (!image) return '';

		// Set width/height from image url
		var matches = image.match(/(\.\d*x\d*\.)/g);
		if (isImg && matches) {
			var size = matches[0].split('x');
			if (!attrs.width) attrs.width = uk.toNumber(size[0].replace('.', ''));
			if (!attrs.height) attrs.height = uk.toNumber(size[1].replace('.', ''));
		}

		// If a background image, set the background position style
		if (!isImg && options.focus) {
			var styles = attrs.style ? attrs.style.split(';') : [];
			styles.push('background-position:' + focus.left + '% ' + focus.top + '%');
			attrs.style = styles.join(';');
		}

		// Remove unnecessary attributes
		if (attrs.width === 0 || !isImg) attrs.width = false;
		if (attrs.height === 0 || !isImg) attrs.height = false;
		if (!isImg) attrs.alt = false;
		if (!srcset && 'sizes' in attrs) delete(attrs.sizes);

		// Set remaining attributes
		if (options.ukImg) {
			var a = { // Use uk-img lazy loading
				src: isImg ? 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==' : false,
				dataSrc: image,
				dataSrcset: srcset,
				dataUkImg: options.ukImg
			};
			if (sizes && srcset) a.dataSizes = sizes;
			attrs = uk.assign(a, attrs);
		} else if (isImg) {
			attrs.src = image;
			attrs.srcset = srcset;
			if (srcset) attrs.sizes = sizes;
		} else {
			// Set background-image style
			attrs.style = 'background-image:url(' + image + ');' + (attrs.style ? attrs.style : '');
		}

		return attr(attrs, options.tag);
	}

	/**
	 * Render a background image
	 *
	 * @param {(string | Object)} image The image to render.
	 * @param {Object} [attrs] Attributes for the tag.
	 * @param {Object} [options] Options to modify behaviour.
	 * @param {boolean} [close] Should the closing tag be appended?
	 * @return {string}
	 *
	 */
	function imgBg(image, attrs, options, close) {

		if (!uk.isPlainObject(attrs)) attrs = {};
		if (!uk.isPlainObject(options)) {
			if (uk.isBoolean(options)) close = options;
			options = {};
		}

		// Set default attributes
		attrs = uk.assign({
			alt: false,
			class: 'uk-background-cover'
		}, attrs);

		// Set default options
		options = uk.assign({
			tag: 'div',
			focus: true
		}, options);

		var tag = img(image, attrs, options);
		return close ? tag + '</' + options.tag + '>' : tag;
	}

	/**
	 * Check if a string is a tag
	 *
	 * @param {string} str The string to be checked.
	 * @return {boolean}
	 *
	 */
	function isTag(str) {
		return /<[a-z][\s\S]*>/i.test(str);
	}

	/**
	 * Render a link
	 *
	 * @param {(string | Object)} url The href attribute.
	 * @param {(string | Object | boolean | null)} [label] The link label.
	 * @param {(Object | string | boolean} [attrs] Attributes for the link.
	 * @return {string}
	 *
	 */
	function link(url, label, attrs) {

		if (label === void 0) label = '';
		if (attrs === void 0) attrs = {};

		var _blank = false;

		if (uk.isBoolean(attrs)) {
			_blank = attrs;
			attrs = {};
		} else if (!uk.isPlainObject(attrs)) {
			attrs = {class: attrs};
		}

		if (uk.isPlainObject(url)) {
			if ('href' in url) {
				attrs = url;
				url = attrs.href;
			} else if ('url' in attrs) {
				label = url[label ? label : 'title'];
				url = url.url;
			} else {
				attrs = url;
				url = '#';
			}
		}

		if (label === null) {
			label = url;
		} else if (uk.isPlainObject(label)) {
			attrs = label;
			label = '';
		} else if (uk.isBoolean(label)) {
			_blank = label;
			label = '';
		}

		if (uk.includes(url, '://')) {
			_blank = true;
		}

		attrs.href = url;
		if (!('target' in attrs)) {
			attrs.target = _blank ? '_blank' : false;
		}
		if (!('rel' in attrs)) {
			attrs.rel = _blank ? 'noopener' : false;
		}

		return wrap(label, attrs, 'a');
	}

	/**
	 * Load an asset and append it
	 *
	 * @param {string} type The type of element to be created.
	 * @param {Object} attrs The attributes for the created element.
	 * @param {string} element The element to append the created element.
	 * @return {Promise}
	 *
	 */
	function loadAsset(type, attrs, element) {
		var name = 'nb.loadS' + (type === 'script' ? 'cript' : 'tyle');
		profilerStart(name);
		return new Promise(function(resolve, reject) {
			var tag = document.createElement(type);
			for (var key in attrs) {
				if (uk.hasOwn(attrs, key)) {
					var value = attrs[key];
					if (key === 'element') {
						element = value;
					} else {
						tag[key] = value;
					}
				}
			}
			tag.onload = function() {
				profilerStop(name);
				resolve();
			};
			tag.onerror = function(e) {
				profilerStop(name);
				reject(e);
			};
			uk.append(element, tag);
		});
	}

	/**
	 * Load assets
	 *
	 * @param {Array} assets The assets to load.
	 * @param {Promise}
	 *
	 */
	function loadAssets(assets) {
		var promises = [];
		for (var i = 0; i < assets.length; i++) {
			var asset = assets[i];
			promises.push(
				(uk.isPlainObject(asset) ?
					(asset.src ? asset.src : (asset.href ? asset.href : '')) :
					asset
				).substr(-2) === 'js' ?
				loadScript(asset) : loadStyle(asset)
			);
		}
		return Promise.all(promises);
	}

	var componentData = {};

	/**
	 * Load required components
	 *
	 * @return {Promise}
	 *
	 */
	function loadComponents() {

		if (uk.isEmpty(componentData)) {
			componentData = data(uk.$('html'), 'load-components', true, ' ');
		}

		if (!uk.isEmpty(componentData) && uk.isPlainObject(componentData)) {

			var assets = [];
			var component = null;
			var elements = [];
			var unused = [];

			for(var i = 0; i < componentData.components.length; i++) {
				component = componentData.components[i];
				elements = uk.$$('[data-uk-' + component + ']');
				if (elements.length && !(component in UIkit)) {
					assets.push(componentData.path + component + '.min.js');
				} else {
					unused.push(component);
				}
			}

			componentData.components = unused;
			return loadAssets(assets);
		}
	}

	/**
	 * Load a script and append it to the body
	 *
	 * @param {(string | Object)} src The src url of the script to be loaded.
	 * @return {Promise}
	 *
	 */
	function loadScript(src) {
		return loadAsset(
			'script',
			(uk.isPlainObject(src) ? src : {src: src, async: true}),
			(arguments.length > 1 ? arguments[1] : 'body')
		);
	}

	/**
	 * Load a style and append it to the head
	 *
	 * @param {(string | Object)} src The src url of the style to be loaded.
	 * @return {Promise}
	 *
	 */
	function loadStyle(src) {
		var attrs = (uk.isPlainObject(src) ? src : {href: src});
		attrs.rel = 'stylesheet';
		return loadAsset('link', attrs, (arguments.length > 1 ? arguments[1] : 'head'));
	}

	/**
	 * Make a string a tag if it is not already
	 *
	 * @param {string} str The string to be processed.
	 * @return {string}
	 *
	 */
	function makeTag(str) {
		return isTag(str) ? str :
			(str.substr(0, 1) === '<' ? '' : '<') +
				str + (str.substr(str.length - 1, 1) === '>' ? '' : '>');
	}

	/**
	 * Perform an asynchronous POST request
	 *
	 * @param {string} [url]
	 * @param {(Object | HTMLElement)} [data]
	 * @return {Promise}
	 *
	 */
	function post(url, data) {
		return ajax(url, {
			data: objectToFormData(data),
			method: 'POST'
		});
	}

	/**
	 * Start a ProfilerPro timer
	 *
	 * @param {string} name Name of your event.
	 * @return {(Array | null)} Event to be used for stop call.
	 *
	 */
	function profilerStart(name) {
		return 'profiler' in window ? profiler.start(name) : null;
	}

	/**
	 * Stop a ProfilerPro timer
	 *
	 * @param {string} name The event name.
	 * @return {number} Returns elapsed time since the start() call.
	 *
	 */
	function profilerStop(name) {
		return 'profiler' in window ? profiler.stop(name) : 0;
	}

	/**
	 * Punctuate a string if it is not already
	 *
	 * @param {string} str The string to be punctuated.
	 * @param {string} [punctuation] The punctuation mark to use.
	 * @return {string}
	 *
	 */
	function punctuateString(str, punctuation) {
		if (punctuation === void 0) punctuation = '.';
		if (!(/.*[.,\/!?\^&\*;:{}=]$/.test(str))) str = str + punctuation;
		return str;
	}

	/**
	 * Create a query string from a key:value object
	 *
	 * @param {Object} query The `key:value` object.
	 * @return {string}
	 *
	 */
	function queryString(query) {
		return '?' + Object.keys(query).map(function(key) {
			return key + '=' + query[key];
		}).join('&');
	}

	/**
	 * Set an option value
	 *
	 * @param {string} key The option name.
	 * @param {*} value The option value.
	 *
	 */
	function setOption(key, value) {
		if (key === void 0 || value === void 0) return;
		if (!(key in NBkit.options)) return;
		if (uk.isPlainObject(NBkit.options[key]) && uk.isPlainObject(value)) {
			NBkit.options[key] = uk.assign({}, NBkit.options[key], value);
		} else {
			NBkit.options[key] = value;
		}
	}

	/**
	 * Return a UIkit alert
	 *
	 * @param {string} message The alert message.
	 * @return {string}
	 *
	 */
	function ukAlert(message) {

		if (message === void 0) return;
		if (uk.isArray(message)) message = message.join('<br>');

		var style = 'primary';
		var options = {};
		var close = false;
		var attrs = {class: ['uk-alert']};

		// Get and set any other arguments provided
		for (var i = 1; i < arguments.length; i++) {
			var arg = arguments[i];
			var n;
			if (uk.isBoolean(arg)) {
				close = arg;
			} else if (uk.isNumeric(arg)) {
				arg = uk.toNumber(arg);
				if (i === 1) {
					style = arg < 100 || arg >= 400 ? 'danger' : 'success';
				} else {
					options.duration = arg;
				}
			} else if (uk.isString(arg)) {
				style = arg;
			} else if (uk.isArray(arg)) {
				for (n = 0; n < arg.length; n++) attrs.class.push(arg[n]);
			} else if (uk.isPlainObject(arg)) {
				if ('animation' in arg) {
					options = uk.assign(options, arg);
				} else {
					if ('class' in arg) {
						if (!uk.isArray(arg.class)) arg.class = arg.class.split(' ');
						for (n = 0; n < arg.class.length; n++) attrs.class.push(arg.class[n]);
						delete arg.class;
					}
					attrs = uk.assign(attrs, arg);
				}
			}
		}

		// Add role=alert to 'danger' style
		if (style === 'danger') attrs.role = 'alert';

		// Set style class
		attrs.class.push('uk-alert-' + style);

		// Set options
		attrs['dataUkAlert'] = close || Object.keys(options).length ?
			uk.assign({}, NBkit.options.ukAlert, options) : true;

		return wrap(
			(close ? attr({
				class: 'uk-alert-close',
				dataUkClose: true
			}, 'a', true) : '') +
			wrap(message, (isTag(message) ? '' : 'p')),
			attrs,
			'div'
		);
	}

	/**
	 * Generate a UIkit notification
	 *
	 * @param {(Object | string)} options The UIkit Notification options.
	 * @return {Promise}
	 *
	 */
	function ukNotification(options) {

		if (options === void 0) return;
		if (uk.isString(options)) options = {message: options};
		if (!uk.isPlainObject(options)) return;

		// Get and set any other arguments provided
		for (var i = 1; i < arguments.length; i++) {
			var arg = arguments[i];
			if (uk.isNumeric(arg)) {
				options.timeout = uk.toNumber(arg);
			} else if (uk.isString(arg)) {
				if (arg.includes('-')) {
					options.pos = arg;
				} else {
					options.status = arg;
				}
			} else if (uk.isPlainObject(arg)) {
				options = uk.assign(arg, options);
			}
		}

		return new Promise(function(resolve, reject) {
			if (!uk.isUndefined(options.message)) {
				options = uk.assign({}, NBkit.options.ukNotification, options);
				if ('notification' in UIkit) {
					UIkit.notification(options);
					resolve();
				} else {
					loadScript('/site/templates/js/components/notification.min.js')
						.then(function() {
							UIkit.notification(options);
							resolve();
						})
						.catch(function(e) {
							reject(e);
						});
				}
			}
		});
	}

	/**
	 * Return a UIkit spinner
	 *
	 * @return {string}
	 *
	 */
	function ukSpinner() {

		var attrs = {};
		var options = {};

		// Get and set any other arguments provided
		for (var i = 1; i < arguments.length; i++) {
			var arg = arguments[i];
			if (uk.isNumeric(arg)) {
				options.ratio = uk.toNumber(arg);
			} else if (uk.isString(arg)) {
				tag = arg;
			} else if (uk.isArray(arg)) {
				attrs.class = arg;
			} else if (uk.isPlainObject(arg)) {
				attrs = uk.assign(attrs, arg);
			}
		}

		attrs.dataUkSpinner = Object.keys(options).length ? options : true;

		return attr(attrs, 'span', true);
	}

	/**
	 * Wrap a string, or strings, in an HTML tag
	 *
	 * @param {(string | Array)} str The string(s) to be wrapped.
	 * @param {(string | Array | Object)} wrapper The html tag(s) or tag attributes.
	 * @param {string} [tag] An optional tag, used if wrapper is an array/object.
	 * @return {string}
	 *
	 */
	function wrap(str, wrapper, tag) {

		profilerStart('nb.wrap');

		// If no wrapper is specified, return the string
		if ((wrapper === void 0 || !wrapper) && tag === void 0) return str;

		// If the wrap is an array, either:
		// Render as attributes if associative and a tag is specified;
		// Render as a <div> with class attribute if sequential
		if (uk.isArray(wrapper) || uk.isPlainObject(wrapper)) wrapper = attr(wrapper, tag);

		// If the wrap begins with a UIkit 'uk-' or NBkit 'nb-' class,
		// the wrap becomes a <div> with class attribute
		if (uk.isString(wrapper) && (uk.startsWith(wrapper, 'uk-') || uk.startsWith(wrapper, 'nb-'))) {
			wrapper = '<div class="' + wrapper + '">';
		}

		// Make sure the wrap is an html tag
		wrapper = makeTag(wrapper);

		// If the string is an array, implode by the wrapper tag
		if (uk.isArray(str)) {
			// Implode by joined wrap
			var e = wrapper.split('>')[0].replace('<', '');
			str = str.join('</' + e.split(' ')[0] + '><' + e + '>');
		}

		// Split the wrap for wrapping the string
		var parts;
		if (uk.includes(wrapper, '></') && !(/=['|\"][^']+(><\/)[^']+['|\"]/.test(wrapper))) {
			parts = wrapper.split('></');
			wrapper = parts[0] + '>' + str + '</' + parts.splice(1).join('></');
		} else {
			parts = wrapper.split('>', 2);
			wrapper = parts.length === 2 ?
				wrapper + str + '</' + (parts[0].split(' ')[0]).replace(/</gi, '') + '>' :
				str;
		}

		profilerStop('nb.wrap');

		return wrapper;
	}

	/**
	 * Polyfill for Element.closest();
	 *
	 */
	if (!Element.prototype.matches) {
		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
	}

	if (!Element.prototype.closest) {
		Element.prototype.closest = function(s) {
			var this$1 = this;
			var el = this$1;
			do {
				if (el.matches(s)) return el;
				el = el.parentElement || el.parentNode;
			} while (el !== null && el.nodeType === 1);
			return null;
		};
	}

	/**
	 * Polyfill for FormData.entries();
	 *
	 */
	var formDataEntries = function(form) {

		if (typeof FormData === 'function' && 'entries' in FormData.prototype) {

			return Array.from(new FormData(form).entries());

		} else {

			var entries = [];
			var elements = form.elements;

			for (var i = 0; i < elements.length; i++) {

				var el = elements[i];
				var tagName = el.tagName.toUpperCase();

				if (tagName === 'SELECT' || tagName === 'TEXTAREA' || tagName === 'INPUT') {

					var type = el.type;
					var name = el.name;

					if (
						name &&
						!el.disabled &&
						type !== 'submit' &&
						type !== 'reset' &&
						type !== 'button' &&
						((type !== 'radio' && type !== 'checkbox') || el.checked)
					) {
						if (tagName === 'SELECT') {
							var options = el.getElementsByTagName('option');
							for (var j = 0; j < options.length; j++) {
								var option = options[j];
								if (option.selected) entries.push([name, option.value]);
							}
						} else if (type === 'file') {
							entries.push([name, '']);
						} else {
							entries.push([name, el.value]);
						}
					}
				}
			}

			return entries;
		}
	};

	/**
	 * Convert an object to FormData for sending.
	 *
	 * @param {Object} data The object to convert.
	 * @return {FormData}
	 *
	 */
	var objectToFormData = function(data, form, namespace) {

		if (!uk.isPlainObject(data)) return new FormData(data);

		var formData = form || new FormData();
		for (var key in data) {
			if (uk.hasOwn(data, key)) {
				if (uk.isPlainObject(data[key])) {
					objectToFormData(data[key], formData, key);
				} else {
					formData.append((namespace ? namespace + '[' + key + ']' : key), data[key]);
				}
			}
		}

		return formData;
	};

	/**
	 * Cookie Setting
	 *
	 */
	var CookieSetting = {

		props: {
			name: String,
			off: String,
			on: String,
		},

		connected: function() {
			uk.addClass(this.$el, getClassName(this));
			uk.append(this.$el, this.renderInput() + this.renderInput(true));
		},

		events: [
			{
				name: 'change',

				delegate: function() {
					return 'input[type="radio"]';
				},

				handler: function(e) {
					cookieConsent(e.target.name, e.target.value);
				}
			}
		],

		methods: {

			renderInput: function(type) {

				// Render a radio input

				var value = type ? 1 : 0;
				return wrap(
					wrap(
						attr({
							type: 'radio',
							name: this.name,
							id: [this.name, value].join('_'),
							class: 'uk-radio',
							value: '' + value,
							checked: this.name in nbCookie.settings && nbCookie.settings[this.name] === value
						}, 'input') +
						wrap(
							this[type ? 'on' : 'off'],
							'span'
						),
						'label'
					),
					'div'
				);
			}
		}
	};

	UIkit.component('nbCookieSetting', CookieSetting);

	/**
	 * API
	 *
	 */
	var NBkit = function() {};
	var duration = 256;

	// Options
	NBkit.options = {
		graphql: '/graphql',
		offset: 128,
		duration: duration,
		ukAlert: {
			animation: true,
			duration: duration
		},
		ukNotification: {
			status: 'primary',
			pos: 'top-right',
			timeout: duration * 16
		}
	};

	// Utilities
	NBkit.util = Object.freeze({
		ajax: ajax,
		attr: attr,
		attrValue: attrValue,
		base64_decode: base64_decode,
		base64_encode: base64_encode,
		cookieConsent: cookieConsent,
		data: data,
		debounce: debounce,
		formDataEntries: formDataEntries,
		getClassName: getClassName,
		getPreviousSibling: getPreviousSibling,
		getRequestResponse: getRequestResponse,
		graphql: graphql,
		hasStorage: hasStorage,
		img: img,
		imgBg: imgBg,
		isTag: isTag,
		link: link,
		loadAssets: loadAssets,
		loadComponents: loadComponents,
		loadStyle: loadStyle,
		loadScript: loadScript,
		makeTag: makeTag,
		post: post,
		profilerStart: profilerStart,
		profilerStop: profilerStop,
		punctuateString: punctuateString,
		queryString: queryString,
		setOption: setOption,
		ukAlert: ukAlert,
		ukNotification: ukNotification,
		ukSpinner: ukSpinner,
		wrap: wrap
	});

	/**
	 * Initialise
	 *
	 */
	function init() {

		profilerStart('nb.init');

		// Load components
		loadComponents();
		var nbJson = uk.$$('[data-uk-nb-json]');
		if (nbJson.length) {
			nbJson.forEach(function(el) {
				uk.on(el, 'complete', function() {
					loadComponents();
				});
			});
		}

		// Cookie Consent Settings
		if (uk.hasAttr(uk.$('html'), 'data-nb-cookie')) {

			// Get the data
			nbCookie = uk.assign(nbCookie, data(uk.$('html'), 'nb-cookie', true));

			if (hasStorage) {

				var set = false;
				var settings = localStorage.getItem('nbCookie');
				if (settings) {
					try {
						// Consent Settings present, use them
						nbCookie.settings = JSON.parse(settings);
						set = true;
					} catch (e) {
						// Could not parse data, need to request again
					}
				}

				if (!set) {

					// Get the form
					ajax(nbCookie.url).then(function(result) {

						if (result.status === 200) {

							var timeout = duration * duration; // 65536

							// Set default settings before the notification closes
							setTimeout(function() {
								cookieConsent(false);
							}, timeout - 256);

							// Display the notification
							ukNotification({
								message: nbCookie.message,
								timeout: timeout,
								clsContainer: 'nb-cookie uk-notification'
							}).then(function() {

								// Handle accept all action // @todo rename this and set
								uk.once(uk.$('.all'), 'click', function() {
									cookieConsent(true);
								});

								// Handle set action, display form in modal
								uk.once(uk.$('.set'), 'click', function() {
									cookieConsent(false);
									if (window.location.href.split('#')[0] === nbCookie.url) {
										// Already on cookies page, go to form
										window.location.href = nbCookie.id;
									} else {
										UIkit.modal.dialog(
											wrap(
												wrap(result.response.title, 'h2') +
												attr({
													type: 'button',
													class: 'uk-modal-close-default',
													dataUkClose: true
												}, 'button', true),
												'uk-modal-header'
											) +
											wrap(result.response.body, 'uk-modal-body')
										);
									}
								});
							});

						} else {
							// Set all to false
							cookieConsent(false);
						}

					}, function() {
						cookieConsent(false);
					});
				}
			} else {
				// Set all to false
				cookieConsent(false);
			}
		}

		uk.ready(function() {

			// Set offset option based on header height
			var header = uk.$('header');
			if (header) setOption('offset', header.offsetHeight + 32);

			// Make sure external links have the appropriate rel attributes
			var links = uk.$$('a[target=_blank]');
			if (links) {
				var protect = ['noopener'];
				links.forEach(function(link) {
					var rel = uk.attr(link, 'rel');
					rel = uk.isString(rel) ? rel.split(' ') : [];
					for (var i = 0; i < protect.length; i++) if (rel.indexOf(protect[i]) < 0) rel.push(protect[i]);
					uk.attr(link, 'rel', rel.join(' '));
				});
			}

			profilerStop('nb.init');
		});
	}

	{
		init(NBkit);
	}

	return NBkit;

}));

var nb = NBkit.util;
