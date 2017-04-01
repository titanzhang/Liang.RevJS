// var productDetailConfig = {
//   serviceUrl: "/product/get/",
//   resultID: "productPageResult",
//   titleID: "productTitle",
//   detailID: "productDetail",
//   historyID: "productPriceHistory",
//   historyTemplate: '<div class="row"><div class="col-md-4">{:price}</div><div class="col-md-4">{:date}</div></div>'
// };

revjs.ProductDetailModule = {
	configName: "productDetailModule"
}

revjs.ProductDetailModule.init = function() {
	var config = revjs.getConfig(this.configName);
	if (config === undefined) {
		return false;
	}

	var dialog = $('#' + config.resultID);
	var titleObj = $('#' + config.titleID);
	var detailObj = $('#' + config.detailID);
	var imageObj = $('#' + config.imageID);
	var historyObj = $('#' + config.historyID);
	var historyTemplate = config.historyTemplate;

	revjs.on('ProductDetail.show', this.onShowHide(dialog, true));
	revjs.on('ProductDetail.hide', this.onShowHide(dialog, false));
	revjs.on('ProductDetail.setTitle', this.onSetTitle(titleObj));
	revjs.on('ProductDetail.setImage', this.onSetImage(imageObj));
	revjs.on('ProductDetail.setDetail', this.onSetDetail(detailObj));
	revjs.on('ProductDetail.setHistory', this.onSetHistory(historyObj, historyTemplate));
	revjs.on('ProductDetail.getContent', this.onGetContent(config.serviceUrl, this.httpWrapper()));

	this.registerLinks();
}

revjs.ProductDetailModule.registerLinks = function() {
	$("[revlink='product']").click(this.onClickProduct());
}

revjs.ProductDetailModule.onClickProduct = function() {
	var callback = function(event) {
		revjs.trigger('ProductDetail.setTitle', 'Find product');
		revjs.trigger('ProductDetail.setDetail', 'Processing ...');
		revjs.trigger('ProductDetail.setImage', '');
		revjs.trigger('ProductDetail.show');
		revjs.trigger('ProductDetail.getContent', $(this).attr('reval'));
		return false;
	};
	return callback;
}

revjs.ProductDetailModule.onShowHide = function(titleObj, bShow) {
	var callback = function() {
		if (bShow) {
			titleObj.modal('show');
		} else {
			titleObj.modal('hide');
		}
	}
	return callback;
}

revjs.ProductDetailModule.onSetTitle = function(titleObj) {
	var callback = function(titleHTML) {
		titleObj.html(titleHTML);
	}
	return callback;
}

revjs.ProductDetailModule.onSetImage = function(imageObj) {
	var callback = function(imageHTML) {
		imageObj.html(imageHTML);
	}
	return callback;
}

revjs.ProductDetailModule.onSetDetail = function(detailObj) {
	var callback = function(detailHTML) {
		detailObj.html(detailHTML);
	}
	return callback;
}

revjs.ProductDetailModule.onSetHistory = function(historyObj, historyTemplate) {
	var callback = function(productHistory) {
		var historyHTML = "";
		var i;
		for (i in productHistory) {
			var history = productHistory[i];
			var rowHTML = historyTemplate;
			var date = new Date(history.date);
			rowHTML = rowHTML.replace('{:price}', history.price);
			rowHTML = rowHTML.replace('{:date}', date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate());
			historyHTML += rowHTML;
		}

		historyObj.html(historyHTML);
	}
	return callback;
}

revjs.ProductDetailModule.onGetContent = function(serviceUrl, contentCallback) {
	var callback = function(productUrl) {
		var apiUrl = serviceUrl + encodeURIComponent(productUrl);
		$.get(apiUrl, contentCallback);
	}
	return callback;
}

revjs.ProductDetailModule.httpWrapper = function() {
	var callback = function(data, status) {
		if (status === 'success' && data.status === true) {
			revjs.trigger('ProductDetail.setTitle', '<a href="'+data.product.url+'" target="_blank">'+data.product.title+'</a>');
			revjs.trigger('ProductDetail.setDetail', data.product.price + '('+ (data.product.price_change_percent*100).toFixed(2) +'%)');
			revjs.trigger('ProductDetail.setHistory', data.history);
			if (data.product.image !== undefined && data.product.image.trim().length > 0) {
				revjs.trigger('ProductDetail.setImage', '<img src="'+data.product.image+'" alt="'+data.product.title+'" />')
			} else {
				revjs.trigger('ProductDetail.setImage', '');
			}
			revjs.trigger('ProductDetail.show');
		} else {
			revjs.trigger('ProductDetail.setTitle', 'Fail to find product');
			revjs.trigger('ProductDetail.setDetail', '');
			revjs.trigger('ProductDetail.setImage', '');
			revjs.trigger('ProductDetail.setHistory', []);
			revjs.trigger('ProductDetail.show');
		}		
	}
	return callback;
}

revjs.ProductDetailModule.init();