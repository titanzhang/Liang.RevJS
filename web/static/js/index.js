
revjs.FindProductModule = {
	configName: 'productModule'
};

revjs.FindProductModule.init = function() {
	var config = revjs.getConfig(this.configName);
	if (config === undefined) {
		return false;
	}

	var urlInputObj = $('#' + config.urlInputID);
	$('#' + config.viewButtonID).click(this.onClickUrl(urlInputObj));
}

revjs.FindProductModule.onClickUrl = function(urlInputObj) {
	var clickCallback = function() {
		revjs.trigger('ProductDetail.setTitle', 'Find product');
		revjs.trigger('ProductDetail.setDetail', 'Processing ...');
		revjs.trigger('ProductDetail.show');
		revjs.trigger('ProductDetail.getContent', urlInputObj.val());
	};
	return clickCallback;
}

revjs.FindProductModule.init();