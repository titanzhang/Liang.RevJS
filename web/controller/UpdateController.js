module.exports = function(req, res) {
	var renderPage = function(numUpdated) {
		res.send({
			status: true,
			numUpdated: numUpdated
		});
	};

	var renderError = function(error) {
		res.send({
			status: false,
			error: error.message
		})
	};

	UpdateController.update(req.body)
		.then(renderPage)
		.catch(renderError);
}

var UpdateController = UpdateController || {};

// Parameters
//   productList: [ {hash,url,...} ]
UpdateController.update = function(productList) {
	console.log(productList);
	return Promise.resolve(productList.length);
}