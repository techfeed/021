var fs = require('fs');
var ECT = require('ect');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var s = require('underscore.string');
var beautify_js = require('js-beautify'); // also available under "js" export
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;

var cmdDir = __dirname;

var DEST_ROOT = cmdDir.substring(0, cmdDir.lastIndexOf('/')) + '/openfest/client/onsenui/www/';

var NAVIGATOR_NAME = 'myNavigator';
var VIEW_ROOT = 'views';

process.chdir('templates/onsenui');

var renderer = ECT({ root: '.', ext: '.ect' });
var templateParams = {
	navigator: NAVIGATOR_NAME,
	viewRoot: VIEW_ROOT,
	contextRoot: '/onsenui/www',
	destDir: DEST_ROOT,
	generate: generate,
	_: _,
	s: s,
	mergeEnv: function(merged) {
		var clone = _.clone(this);
		return _.extend(clone, merged);
	}
};

loadModelDefs();
generate('template.html', 'index.html', {});

function loadModelDefs() {
	//var dirpath = cmdDir.substring(0, cmdDir.lastIndexOf('/')) + '/openfest/common/models/';
	var appDir = cmdDir.substring(0, cmdDir.lastIndexOf('/')) + '/openfest';
	var appServerDir = appDir + '/server';
	var modelConfigPath = appServerDir + '/model-config.json';
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
				dirPath = appDir + '/node_modules/' + sourcePath;
			} else {
				dirPath = appServerDir + '/' + sourcePath;
			}
			jsonFilePaths = fs
					.readdirSync(dirPath)
					.filter(jsonPathFilter)
					.map(function(jsonFileName) {
						return dirPath + '/' + jsonFileName;
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
	templateParams.models = modelDefs;
}

function generate(template, dest, params) {
	var filePath = DEST_ROOT + dest;
	var dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
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

	var text = renderer.render(template, params);
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
}
