global.baseDir = __dirname + "/../";

global.load = function(moduleName) {
	var jsName = moduleName.replace(/\./g, "/");
	return require(baseDir + jsName);
}