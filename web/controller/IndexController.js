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
		const parser = require('cheerio');
		const selector = parser.load(pageContent);

		// Digest of url as ID
		product.urlHash = require('crypto').createHash('md5').update(url).digest('hex');

		// Get title
		let title = selector("meta[property='og:title']").attr('content');
		if (title === undefined) {
			title = selector("meta[name='twitter:title']").attr('content');
		}
		if (title === undefined) {
			return Promise.reject({ message: 'Title not found in page'});
		}
		product.title = title;

		// Get price
		let price = selector("meta[itemprop='price']").attr('content');
		if (price === undefined) {
			return Promise.reject({message: 'Price not found in page'});
		}
		product.price = parseFloat(price.replace('$', ''));

		// Get Description
		let description = selector('#product_description_content').text();
		if (description === undefined) {
			return Promise.reject({message: 'Description not found in page'});
		}
		const Utils = load('common.Utils');
		description = Utils.deepReplace(/  /g, " ", description);
		description = Utils.deepReplace(/\n /g, "\n", description);
		description = Utils.deepReplace(/ \n/g, "\n", description);
		description = Utils.deepReplace(/\n\n/g, "\n", description);
		product.description = description;

		// Main image
		let mainImage = selector("img[class='main_image']").attr('src');
		if (mainImage === undefined) {
			mainImage = '';
		}
		product.image = mainImage;

		// Thumbnail
		let thum = selector("link[itemprop='thumbnail']").attr('href');
		if (thum === undefined) {
			thum = '';
		}
		product.thumbnail = thum;
		// console.log(product);
		return product;
	} catch(e) {
		console.log(e);
		return Promise.reject({message: "IndexController.extractPage: " + e.message});
	}
}

IndexController.updateIndex = function(context) {
	try {
		const url = context.url;
		const product = context.product;

		const ProductDO = load('web.domain.SolrProduct').DO;
		const HistoryDO = load('web.domain.SolrHistory').DO;

		// Initialize the solr product object
		let productDO = new ProductDO();
		productDO.setHash(product.urlHash).
			setTitle(product.title).
			setContent(product.description).
			setUrl(url).
			setPrice(product.price).
			setPriceChange(0).
			setPriceChangePercent(0).
			setImage(product.image).
			setThumbnail(product.thumbnail);

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
					// Image hack
					if (existProduct.image === undefined || existProduct.image.length === 0) {
						return this.updateProductOnly(productDO);
					} else {
						return existProduct;
					}
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

IndexController.updateProductOnly = function(productDO) {
	const productDAO = load('web.domain.SolrProduct').DAO;		
	return productDAO.add(productDO);
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
