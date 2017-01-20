module.exports = function(req, res) {
	var renderPage = function(hash) {
		res.send({
			status: true,
			docId: hash
		});
	};

	var renderError = function(error) {
		res.send({
			status: false,
			error: error.message
		})
	};

	IndexController.run(req.params.url)
		.then(renderPage)
		.catch(renderError);
}

var IndexController =  IndexController || {};
IndexController.run = function(url) {
	let context = {url: url};

	let taskChain = this.getPageContent(context);
	taskChain = taskChain.then( (pageContent) => {
		// console.log(pageContent);
		context.pageContent = pageContent;
		return context;
	});

	taskChain = taskChain.then(this.extractPage.bind(this));
	taskChain = taskChain.then( (product) => {
		context.product = product;
		return context;
	});

	taskChain = taskChain.then(this.updateIndex.bind(this));
	taskChain = taskChain.then( (productUpdated) => {
		return productUpdated.hash;
	});

	return taskChain;
}

IndexController.getPageContent = function(context) {
	try {
		const url = context.url;
		const curl = load("common.Curl");

		// Download page
		let taskChain = curl.get(url, 10000);

		// Got http return
		taskChain = taskChain.then( (httpReturn) => {
			return httpReturn.data;
		});

		// Error handling
		taskChain = taskChain.catch( (error) => {
			return Promise.reject({ message: error.message });
		});

		return taskChain;
	} catch (e) {
		console.log(e);
		return Promise.reject({message: "IndexController.getPageContent: " + e.message});
	}
}

IndexController.extractPage = function(context) {
	try {
		const url = context.url;
		const pageContent = context.pageContent;

		var product = {};

		// Digest of url as ID
		product.urlHash = require('crypto').createHash('md5').update(url).digest('hex');

		// Get title
		var regexp = /<meta name="og:title" content="([^"]+)"[^>]*>/;
		var regResult = regexp.exec(pageContent);
		if (regResult !== null) {
			product.title = regResult[1];
		} else {
			regexp = /<meta name="twitter:title" content="([^"]+)"[^>]*>/;
			regResult = regexp.exec(pageContent);
			if (regResult === null) {
				return Promise.reject({ message: 'Title not found in page'});
			}
			product.title = regResult[1];
		}

		// Get price
		regexp = /<meta itemprop="price" content="([^"]+)"[^>]*>/;
		regResult = regexp.exec(pageContent);
		if (regResult === null) {
			return Promise.reject({message: 'Price not found in page'});
		}
		product.price = parseFloat(regResult[1].replace('$', ''));

		return product;
	} catch(e) {
		console.log(e);
		return Promise.reject({message: "IndexController.extractPage: " + e.message});
	}
}

IndexController.updateIndex = function(context) {
	try {
		const url = context.url;
		const pageContent = context.pageContent;
		const product = context.product;

		const ProductDO = load('web.domain.SolrProduct').DO;
		const HistoryDO = load('web.domain.SolrHistory').DO;

		// Simplify content
		const Utils = load('common.Utils');
		let content = Utils.removeHTMLTags(pageContent);
		content = Utils.deepReplace(/  /g, " ", content);
		content = Utils.deepReplace(/\n /g, "\n", content);
		content = Utils.deepReplace(/ \n/g, "\n", content);
		content = Utils.deepReplace(/\n\n/g, "\n", content);

		// Initialize the solr product object
		let productDO = new ProductDO();
		productDO.setHash(product.urlHash).
			setTitle(product.title).
			setContent(content).
			setUrl(url).
			setPrice(product.price).
			setPriceChange(0).
			setPriceChangePercent(0);

		// Create solr history object
		let historyDO = new HistoryDO();
		historyDO.setHash(product.urlHash)
			.setPrice(product.price);

		// Get original price
		let taskChain = load('web.domain.SolrProduct').DAO.get(product.urlHash);

		// Check price change
		taskChain = taskChain.then( (existProduct) => {
			if (existProduct === undefined) { // New product: add to solr
				return this.updateProduct(productDO, historyDO);
			} else { // Existing product: calculate price change and update solr
				
				const oldPrice = existProduct.price;
				if (product.price != oldPrice) { // Price changed, need to update index
					productDO.setPriceChange(product.price - oldPrice);
					productDO.setPriceChangePercent(productDO.price_change/(oldPrice==0?0.1:oldPrice));

					return this.updateProduct(productDO, historyDO)
				} else { // No price change, skip update
					return existProduct;
				}
			}
		});

		taskChain = taskChain.catch( (error) => {
			return Promise.reject({message: 'IndexController.updateIndex: ' + error.message})
		});

		return taskChain;
	} catch(e) {
		console.log(e);
		return Promise.reject({message: 'IndexController.updateIndex(exception):' + e.message});
	}
}

IndexController.updateProduct = function(productDO, historyDO) {
	const productDAO = load('web.domain.SolrProduct').DAO;		
	const historyDAO = load('web.domain.SolrHistory').DAO;		

	return Promise.all([
		historyDAO.add(historyDO),
		productDAO.add(productDO)
	])
	.then( ([historyReturn, productUpdated]) => {
		return productUpdated;
	})
	.catch( (error) => {
		return Promise.reject({ message: 'IndexController.updateProduct: ' + error.message });
	});
}
