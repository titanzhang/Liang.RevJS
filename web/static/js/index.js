
revjs.IndexFormModule = {
	configName: 'indexModule'
};

revjs.IndexFormModule.init = function() {
	var config = revjs.getConfig(this.configName);
	if (config === undefined) {
		return false;
	}

	var urlInputObj = $('#' + config.urlInputID);
	var resultObj = $('#' + config.resultID);
	var messageObj = $('#' + config.messageID);
	$('#' + config.indexButtonID).click(
		this.clickWrapper(
			urlInputObj,
			config.serviceUrl,
			resultObj,
			messageObj,
			this.httpWrapper(resultObj, messageObj)
		)
	);
}

revjs.IndexFormModule.clickWrapper = function(urlInputObj, serviceUrl, resultObj, messageObj, httpCallback) {
	var clickCallback = function() {
		messageObj.text('Processing ... ');
		resultObj.modal('show');

		var url = encodeURIComponent(urlInputObj.val());
		if (url.length > 0) {
			url = serviceUrl + url;
			$.get(url, httpCallback);
		}
	};
	return clickCallback;
}

revjs.IndexFormModule.httpWrapper = function(resultObject, messageObject) {
	var httpCallback = function(data, status) {
		if (status === 'success' && data.status === true) {
			messageObject.text('Success! Product is being tracked');
			resultObject.modal('show');
		} else {
			messageObject.text('Fail to track product');
			resultObject.modal('show');
		}
		setTimeout(function() {
			resultObject.modal('hide');
		}, 3000);
	};
	return httpCallback;
}

revjs.IndexFormModule.init();