module.exports = function(url) {
	return new IndexController().run(url);
}

function IndexController() {
}

IndexController.prototype.run = function(url) {
	// Download page
	var curlReturn = load("common.Utils").curlGet(url, 10);

	if (curlReturn.status === false || curlReturn.statusCode !== 200) {
		return {
			status: false,
			error: 'Retrieve page failed, httpCode=' + curlReturn.statusCode
		};
	}
	
	// create return JSON
	return {
		status: true
	};
}
