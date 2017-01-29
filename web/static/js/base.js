window.revjs = {
	eventList: {}
};

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

revjs.on = function(eventName, callBack) {
	if (this.eventList[eventName] === undefined) {
		this.eventList[eventName] = [];
	}
	this.eventList[eventName].push(callBack);
}

revjs.trigger = function(eventName, params) {
	if (this.eventList[eventName] === undefined) {
		return;
	}
	var i;
	for (i in this.eventList[eventName]) {
		var callBack = this.eventList[eventName][i];
		setTimeout(callBack, 0, params);
	}
}