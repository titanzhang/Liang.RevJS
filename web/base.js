global.baseDir = __dirname + "/../";

global.load = function(moduleName) {
	var jsName = moduleName.replace(/\./g, "/");
	return require(baseDir + jsName);
}

global.loadConfig = function(configName) {
	var jsName = baseDir + 'config/web/' + configName + '.js';
	if (!require('fs').existsSync(jsName)) {
		jsName = baseDir + 'web/config/' + configName + '.js';
	}
	return require(jsName);
}