module.exports = function(req, res) {
	var renderPage = function(context) {
		res.send({
			status: true,
			product: context.product,
			history: context.history
		});
	};

	var renderError = function(error) {
		res.send({
			status: false,
			error: error.message
		})
	};

	ProductController.run(req.params.url)
		.then(renderPage)
		.catch(renderError);
}

var ProductController = ProductController || {};

ProductController.run = function(url) {
	let context = {url: url};

	return this.getHash(context)
		.then(this.getProduct)
		.then(this.getHistory);

}

ProductController.getHash = function(context) {
	try {
		const url = context.url;
		context.hash = require('crypto').createHash('md5').update(url).digest('hex');
		return Promise.resolve(context);
	} catch(e) {
		console.log(e);
		return Promise.reject({ message: 'ProductController.getHash(exception): ' + e.message });
	}
}

ProductController.getProduct = function(context) {
	try {
		const hash = context.hash;
		let taskChain = load('web.domain.SolrProduct').DAO.get(hash);
		taskChain = taskChain.then( (product) => {
			if (product === undefined) {
				return Promise.reject({ message: 'ProductController.getProduct: product not found' });
			} else {
				context.product = product;
				return context;
			}
		});
		return taskChain;
	} catch(e) {
		console.log(e);
		return Promise.reject({ message: 'ProductController.getProduct(exception): ' + e.message });
	}
}

ProductController.getHistory = function(context) {
	try {
		const hash = context.hash;

		return load('web.domain.SolrHistory').DAO.getListByHash(hash)
			.then( (historyList) => {
				context.history = historyList;
				return context;
			})
			.catch( (error) => {
				return Promise.reject({ message: 'ProductController.getHistory: ' + e.message });
			});
	} catch(e) {
		console.log(e);
		return Promise.reject({ message: 'ProductController.getHistory(exception): ' + e.message });
	}

}