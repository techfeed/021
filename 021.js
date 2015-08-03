var fs = require('fs');
var path = require('path');
var ECT = require('ect');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var s = require('underscore.string');
var beautify_js = require('js-beautify'); // also available under "js" export
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;
var minimist = require('minimist');

var cmdDir = __dirname;

function render(templateDir, appDir, dest) {

	var renderer = ECT({
		root: templateDir,
		ext: '.ect'
	});
	var templateParams = {
		templateDir: templateDir,
		viewRoot: 'views',
		contextRoot: '',
		destDir: dest,
		_: _,
		s: s,
		mergeEnv: function(merged) {
			var clone = _.clone(this);
			return _.extend(clone, merged);
		}
	};

	var generator = getGenerator(renderer, templateParams);
	templateParams.generate = generator;
	templateParams.models = loadModelDefs(appDir);

	// process.chdir(templateDir);
	generator('template.html', 'index.html', {});
}

function loadModelDefs(appDir) {
	var appServerDir = path.join(appDir, 'server');
	var modelConfigPath = path.join(appServerDir, 'model-config.json');
	var modelConfig = JSON.parse(fs.readFileSync(modelConfigPath));
	var modelMeta = modelConfig._meta;
	var sourcePaths = modelMeta.sources;
	var modelFilePaths = [];
	var jsonPathFilter = function(path) {
		return /\.json$/.test(path);
	};
	sourcePaths.forEach(function(sourcePath) {
		var dirPath, jsonFilePaths;
		try {
			if (s.startsWith(sourcePath, 'loopback/')) {
				dirPath = path.join(appDir, 'node_modules', sourcePath);
			} else {
				dirPath = path.join(appServerDir, sourcePath);
			}
			jsonFilePaths = fs
					.readdirSync(dirPath)
					.filter(jsonPathFilter)
					.map(function(jsonFileName) {
						return path.join(dirPath, jsonFileName);
					});
		} catch (e) {
			console.log(dirPath + ' is not exists.');
			return;
		}
		modelFilePaths = modelFilePaths.concat(jsonFilePaths)
	});
	var modelDefs = {}, modelDefsTmp = {};
	modelFilePaths.forEach(function(path) {
		var json = fs.readFileSync(path);
		var modelObj = JSON.parse(json);
		modelDefsTmp[modelObj.name] = modelObj;
	});
	for (var modelName in modelConfig) {
		if (modelName === '_meta') {
			continue;
		}
		var model = modelConfig[modelName];
		if (model.public !== false) {
			modelDefs[modelName] = modelDefsTmp[modelName];
		}
	}
	return modelDefs;
}

function getGenerator(renderer, templateParams) {

	return function generate(template, dest, params) {
		var filePath = path.resolve(templateParams.destDir, dest);
		var dirPath = path.dirname(filePath);
		var dirStat = null;
		try {
			dirStat = fs.statSync(dirPath);
		} catch (ignored) {
		}
		if (dirStat && dirStat.isFile()) {
			throw dirPath + ' is already exists, but is file (directory expected).';
		}
		try {
			mkdirp.sync(dirPath);
		} catch (ignored) {
		}
		var clone = _.clone(templateParams);
		params = _.extend(clone, params);

		var templatePath = path.resolve(templateParams.templateDir, template);
		var text = renderer.render(templatePath, params);
		var extension = filePath.substring(filePath.lastIndexOf('.') + 1);
		switch (extension) {
			case 'js': case 'json':
				text = beautify_js(text, { indent_size: 2 });
				break;
			case 'css': case 'less': case 'scss':
				text = beautify_css(text, { indent_size: 2 });
				break;
			case 'html':
				text = beautify_html(text, { indent_size: 2 });
				break;
		}
		fs.writeFileSync(filePath, text);
	};
}


function usage() {
	console.log('node 021.js [OPTIONS] <OUTPUT>');
	console.log('  -a, app\t loopback application root. required.');
	console.log('  -t, type\t generate type. default ionic. [ onsenui | ionic ]');
}

function parseArgs() {
	var opts = {
		string: ['type', 'app'],
		alias: {
			t: 'type',
			a: 'app'
		},
		default: {
			type: 'onsenui'
		}
	};
	var argv = minimist(process.argv.slice(2), opts);
	if (!argv._[0] || !argv.app) {
		usage();
		process.exit(1);
	}
	return argv;
}

function main() {
	var argv = parseArgs();
	var dest = argv._[0];

	var templateDir;
	switch(argv.type) {
		case 'ionic':
			templateDir = 'templates/ionic';
			break;
		case 'onsenui':
			templateDir = 'templates/onsenui';
			break;
		default:
			usage();
			process.exit(1);
	}
	render(templateDir, argv.app, dest);

}

main();
