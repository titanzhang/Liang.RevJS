global.baseDir = "../";

global.load = function(moduleName) {
	var jsName = moduleName.replace(".", "/");
	return require(baseDir + jsName);
}