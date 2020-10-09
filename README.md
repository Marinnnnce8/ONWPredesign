# NB HTML Template for ProcessWire Development

A package for building static code for later ProcessWire development, using [Gulp](https://gulpjs.com) for the build pipeline and [Handlebars](https://handlebarsjs.com/) for templating.

*Note: Terminal commands are given for `yarn` but `npm` equivalents should also work.*

## Installation

	yarn init

Rename the package, and set the version to 1.0.0.

	yarn install

This will install all dependencies and prepare the package for use.

## Configuration
Site configuration is found in the `config` parameter of `package.json`.

You should not need to amend `dist`, `pw` or `src`. However, you should amend the following prior to development:

### nbkit
An array of additional NBkit JS components to use. The one you may not need is `nb-nav`. The others should be retained as they will almost certainly be used in development.

### uikit
An array of additional UIkit JS components to use. The default is `lightbox`, `notification` and `slideshow`.
The majority of projects will not require any more than this, although some may require `tooltip`.
A list of these additional components can be found [here](https://github.com/uikit/uikit/tree/develop/src/js/components).

## UIkit JS

After checking/configuring `config.uikit` run:

	yarn build

This will copy the `uikit-core.min.js` file into the `js` folder, and place the additional UIkit JS components into `js/components`. It will also copy assets into the `dist` folder. If you need to run this task again run:

	yarn reset

to reset the entire project.

## UIkit SCSS
A custom UIkit theme is created based on the variables in `src/scss/abstracts/_variables.scss` and the mixins in `src/scss/abstracts/_mixins.scss`. See https://getuikit.com/docs/sass for more information on UIkit themeing.

## Development

	yarn dev

This will start watching the files, and boot the server at http://localhost:8080.

### Creating a Template
To create a new template run:

	yarn cf -t template-name

This will create a new Handlebars template in `src/html` with the name you have specified.

### Creating a Component
To create a new component run:

	yarn cf -c name

This will create a new Handlebars partial in `src/html/partials/components`, and a new SCSS file in `src/scss/components` with the name you have specified. It will also add the **@import** statement to `main.scss`.

*Note: `-m` will also work*

### Removing a Template
You may not need a template anymore. To remove it, run:

	yarn rf -t template-name

This will remove the Handlebars template.

### Removing a Component
If you no longer require a component, run

	yarn rf -c name

If the name matches (beware of hyphen vs camel case in existing components), it will remove both the Handlebars partial and the SCSS file, and also remove the **@import** statement from `main.scss`.

## Handlebars

### Data
A range of data is passed to Handlebars:

* `src/html/data/index.json` - site-wide data including:
	* `nb` - A couple of site-wide variables - the name of the site and the legal name of the client (for the copyright text). These map to the variables used in ProcessWire development. Additional variables could include `clientTel`, `clientEmail` and `clientAddress`.
	* `ukContainer` - The default `.uk-container` size used by the site.
	* `cta` - The default 'Call to Action' text.
	* `menu` - An array of title/name objects that defines the site menu.
	* `social` - An array of social media data.
	* `legal` - These should not need to be changed, as these are standard on all projects.
	* `items` - arrays of items to be rendered on the site.
* A number of variables are generated based on the template name, and passed to `page` e.g. `page.name` (see `build/tasks/html.js`).
* These variables can be overwritten and/or extended by a `[template-name].json` file in `src/html/data`.
* A few helpers (see `build/tasks/html.js`).

### Partials
Where possible, the provided partials should be used (and can be edited where necessary).

## Linting
ESlint and Sasslint are enabled in this package, but in different ways. ESlint should be enabled in your code editor, whereas Sasslint is run while SCSS files are being watched.

*Note: .eslintignore does not appear to work!*

## Release
When the project is complete, run:

	yarn release

This will reset the project and build everything again, and will also run:

	yarn pw

which prepares files for ProcessWire development.
