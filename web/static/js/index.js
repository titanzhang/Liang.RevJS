
revjs.FindProductModule = {
	configName: 'productModule'
};

revjs.FindProductModule.init = function() {
	var config = revjs.getConfig(this.configName);
	if (config === undefined) {
		return false;
	}

	var urlInputObj = $('#' + config.urlInputID);
	var resultObj = $('#' + config.resultID);
	var messageObj = $('#' + config.messageID);
	var titleObj = $('#' + config.titleID);
	$('#' + config.indexButtonID).click(
		this.clickWrapper(
			urlInputObj,
			config.serviceUrl,
			resultObj,
			titleObj,
			messageObj,
			this.httpWrapper(resultObj, titleObj, messageObj)
		)
	);
}

revjs.FindProductModule.clickWrapper = function(urlInputObj, serviceUrl, resultObj, titleObj, messageObj, httpCallback) {
	var clickCallback = function() {
		titleObj.text('Find product');
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

revjs.FindProductModule.httpWrapper = function(resultObject, titleObj, messageObject) {
	var httpCallback = function(data, status) {
		if (status === 'success' && data.status === true) {
			titleObj.html('<a href="'+data.product.url+'">'+data.product.title+'</a>');
			messageObject.text(data.product.price + '('+ (data.product.price_change_percent*100) +')');
			resultObject.modal('show');
		} else {
			messageObject.text('Fail to find product');
			resultObject.modal('show');
		}
		// setTimeout(function() {
		// 	resultObject.modal('hide');
		// }, 3000);
	};
	return httpCallback;
}

revjs.FindProductModule.init();