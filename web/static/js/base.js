window.revjs = {};

revjs.addConfig = function(configName, config) {
	if (revjs.config === undefined) {
		revjs.config = {};
	}
	revjs.config[configName] = config;
}

revjs.getConfig = function(configName) {
	if (revjs.config === undefined) {
		return undefined;
	} else {
		return revjs.config[configName];
	}
}