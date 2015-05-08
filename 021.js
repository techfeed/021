var fs = require('fs');
var ECT = require('ect');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var s = require('underscore.string');

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
	detectModelPath: detectModelPath,
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
	var dirpath = cmdDir + '/../openfest/common/models/';
	var modelFiles = fs.readdirSync(dirpath).filter(function(path) {
		return /\.json$/.test(path);
	});
	var modelDefs = {};
	modelFiles.forEach(function(fileName) {
		var json = fs.readFileSync(dirpath + fileName);
		var modelObj = JSON.parse(json);
		modelDefs[modelObj.name] = modelObj;
	});
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

	var fd = -1;
	try {
//		fd = fs.openSync(filePath, 'w');
		fs.writeFileSync(filePath, text);
	} finally {
//		if (fd >= 0) {
//			fs.closeSync(fd);
//		}
	}
}

function detectModelPath(model) {
	if (model.plural) {
		return model.plural;
	}
	var modelName = model.name.toLowerCase();
	return modelName + 's';
}
