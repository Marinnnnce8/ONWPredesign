/**
 * Main JS
 *
 * @copyright 2020 NB Communication Ltd
 *
 */

var main = {

	init: function() {

		nb.profilerStart('main.init');

		var linkBoxes = document.querySelectorAll('.js-link-box');

		if(linkBoxes) {
			this.addMultiListener(window, 'load resize', this.linkBoxesSet);
		}

		// Content
		var alignments = ['left', 'right', 'center'];
		uk.$$('.content').forEach(function(block) {

			// Apply UIkit table component
			uk.$$('table', block).forEach(function(el) {
				uk.addClass(el, 'uk-table');
				uk.wrapAll(el, '<div class="uk-overflow-auto">');
			});

			// Inline Images UIkit Lightbox/Scrollspy
			(uk.$$('a[href]', block).filter(function(a) {
				return uk.attr(a, 'href').match(/\.(jpg|jpeg|png|gif|webp)/i);
			})).forEach(function(a) {

				var figure = a.parentElement;
				var caption = uk.$('figcaption', figure);

				// uk-lightbox
				uk.attr(figure, 'data-uk-lightbox', 'animation: fade');
				if (caption) uk.attr(a, 'data-caption', nb.wrap(uk.html(caption), 'div'));

				// uk-scrollspy
				for (var i = 0; i < alignments.length; i++) {
					var align = alignments[i];
					if (uk.hasClass(figure, 'align_' + align)) {
						UIkit.scrollspy(figure, {
							cls: ('uk-animation-slide-' + (align === 'center' ? 'bottom' : align) + '-small')
						});
					}
				}
			});
		});

		nb.profilerStop('main.init');
	},

	renderItems: function(items, config) {

		nb.profilerStart('main.renderItems');

		var metas = ['date_pub', 'dates', 'location'];
		var clsTag = 'uk-label uk-label-primary uk-margin-small-right';

		var out = '';
		for (var i = 0; i < items.length; i++) {

			var item = items[i];

			// Meta
			var meta = '';
			for (var n = 0; n < metas.length; n++) {
				var v = item[metas[n]];
				if (v) meta += nb.wrap(v, 'uk-text-meta');
			}

			// Tags
			var tags = '';
			if (config.showTemplate && item.template) {
				tags += nb.wrap(uk.ucfirst(item.template), clsTag);
			}
			if (uk.isArray(item.tags)) {
				item.tags.forEach(function(tag) {
					tags += nb.wrap(tag.title, clsTag);
				});
			}

			// Summary
			var summary = (item.getSummary ? nb.wrap(item.getSummary, 'p') : '');

			out += nb.wrap(
				nb.wrap(
					// Image
					(item.getImage ? nb.wrap(
						nb.link(
							item.url,
							nb.img(item.getImage, {
								alt: item.title,
								sizes: '(min-width: 640px) 50.00vw',
							}, {
								ukImg: {target: '!* +*'}
							})
						),
						'uk-card-media-top'
					) : '') +
					// Title / Meta / Tags
					nb.wrap(
						nb.wrap(
							nb.link(item.url, item.title, 'uk-link-reset'),
							['uk-card-title', 'uk-margin-remove-bottom'],
							'h3'
						) +
						meta +
						tags,
						'uk-card-header'
					) +
					// Summary
					(summary ? nb.wrap(
						summary,
						'uk-card-body'
					) : '') +
					// CTA
					(config.cta ? nb.wrap(
						nb.link(item.url, config.cta, 'uk-button uk-button-text'),
						'uk-card-footer'
					) : ''),
					'uk-card uk-card-default'
				),
				'div'
			);
		}

		out = nb.wrap(out, {
			class: [
				'uk-child-width-1-2@s',
				'uk-child-width-1-3@m',
				'uk-grid-match',
				'uk-flex-center',
			],
			dataUkGrid: true,
			dataUkScrollspy: {
				target: '> div',
				cls: 'uk-animation-slide-bottom-small',
				delay: NBkit.options.duration,
			}
		}, 'div');

		nb.profilerStop('main.renderItems');

		return out;
	},

	//combining multiple event listeners
	addMultiListener: function(element, eventNames, listener) {
		var events = eventNames.split(' ');
		for (var i=0, iLen=events.length; i<iLen; i++) {
			element.addEventListener(events[i], listener, false);
		}
	},

	//link boxes card-body bottom
	linkBoxesSet: function() {

		var linkBoxes = document.querySelectorAll('.js-link-box');
		
		for(var i = 0;i < linkBoxes.length;i++) {
			var linkBoxText = linkBoxes[i].querySelector('.link-box-text');
			var linkBoxBody = linkBoxes[i].querySelector('.uk-card-body');
			var linkBoxTextHeight = linkBoxText.offsetHeight;

			linkBoxBody.style.bottom = -Math.abs(linkBoxTextHeight) + 'px';
		}
	},
};

uk.ready(function() {
	main.init();
});
