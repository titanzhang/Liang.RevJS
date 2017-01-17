module.exports = function(req, res) {
	var context = {url: req.params.url};
	var renderPage = function(context) {
		res.send({
			status: true,
			docId: context.product.urlHash
		});
	};

	var renderError = function(error) {
		res.send({
			status: false,
			error: error.error
		})
	};

	IndexController.run(context)
		.then(renderPage)
		.catch(renderError);
}

var IndexController =  IndexController || {};
IndexController.run = function(context) {
	return this.getPageContent(context)
		.then(this.extractPage)
		.then(this.updateIndex);
}

IndexController.getPageContent = function(context) {
	const url = context.url;
	return new Promise( (resolve, reject) => {
		const curl = load("common.Curl");
		curl.get(url, 10000)
			.then( (httpReturn) => {
				context.content = httpReturn.data;
				resolve(context);
			})
			.catch( (error) => {
				reject({ error: error.message });
			});
	});
}

IndexController.extractPage = function(context) {
	var url = context.url;
	var pageContent = context.content;

	return new Promise( (resolve, reject) => {
		var product = {};

		// Digest of url as ID
		product.urlHash = require('crypto').createHash('md5').update(url).digest('hex');

		// Get title
		var regexp = /<meta itemprop="caption" content="([^"]+)"[^>]*>/;
		var regResult = regexp.exec(pageContent);
		if (regResult !== null) {
			product.title = regResult[1];
		} else {
			regexp = /<meta name="twitter:title" content="([^"]+)"[^>]*>/;
			regResult = regexp.exec(pageContent);
			if (regResult === null) {
				return reject({ error: 'Title not found in page'});
			}
			product.title = regResult[1];
		}

		// Get price
		regexp = /<meta itemprop="price" content="([^"]+)"[^>]*>/;
		regResult = regexp.exec(pageContent);
		if (regResult === null) {
			return reject({error: 'Price not found in page'});
		}
		product.price = parseFloat(regResult[1].replace('$', ''));

		context.product = product;
		return resolve(context);
	});
}

IndexController.updateIndex = function(context) {
	const url = context.url;
	const product = context.product;
	const pageContent = context.content;

	return new Promise( (resolve, reject) => {
		const Product = load('web.domain.Solr').Product;
		const solrServer = load('web.domain.Solr').manager.getServer('product');

		// Simplify content
		const Utils = load('common.Utils');
		let content = Utils.removeHTMLTags(pageContent);
		content = Utils.deepReplace(/  /g, " ", content);
		content = Utils.deepReplace(/\n /g, "\n", content);
		content = Utils.deepReplace(/ \n/g, "\n", content);
		content = Utils.deepReplace(/\n\n/g, "\n", content);

		// Initialize the solr product object
		let doc = new Product();
		doc.setHash(product.urlHash).
			setTitle(product.title).
			setContent(content).
			setUrl(url).
			setPrice(product.price).
			setPriceChange(0).
			setPriceChangePercent(0);

		// Get original price
		solrServer.getByIds([product.urlHash])
		// Check price change
		.then( (solrReturn) => {
			const oldPrice = solrReturn.data.response.docs[0].price;
			if (product.price != oldPrice) {
				// Price changed, need to update index
				doc.setPriceChange(product.price - oldPrice);
				doc.setPriceChangePercent(doc.price_change/(oldPrice==0?0.1:oldPrice));

				solrServer.addDocuments([doc])
				.then( (solrReturn) => {
					context.indexReturn = solrReturn.data;
					resolve(context);
				})
				.catch( (error) => {
					reject({error: error.message});
				});
			} else {
				// No price change, skip update
				resolve(context);
			}
		})
		.catch( (error) => {
			reject({error: error.message})
		});

	});
}
