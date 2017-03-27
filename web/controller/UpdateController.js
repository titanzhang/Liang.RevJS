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

// request.body
// {hash:<hash>, url:<url>, title:<title>, desc:<description>, price:<price>}
	UpdateController.update(req.body)
		.then(renderPage)
		.catch(renderError);
}

var UpdateController = UpdateController || {};

UpdateController.update = function(productInfo) {
	return Promise.resolve(productList.length);
}

// Parameter: {hash:<hash>, url:<url>, title:<title>, desc:<description>, price:<price>}
// Return: {product: productDO, history: historyDO} or {}(price unchanged, no need to update)
UpdateController.createDO = function(productInfo) {
	try {
		const ProductDO = load('web.domain.SolrProduct').DO;
		const HistoryDO = load('web.domain.SolrHistory').DO;

		// Initialize the solr product object
		let productDO = new ProductDO();
		productDO.setHash(productInfo.hash).
			setTitle(productInfo.title).
			setContent(productInfo.desc).
			setUrl(productInfo.url).
			setPrice(productInfo.price).
			setPriceChange(0).
			setPriceChangePercent(0);

		// Create solr history object
		let historyDO = new HistoryDO();
		historyDO.setHash(productInfo.hash)
			.setPrice(productInfo.price);

		// Get original price
		let taskChain = load('web.domain.SolrProduct').DAO.get(productInfo.hash);

		// Check price change
		taskChain = taskChain.then( (existProduct) => {
			let combinedDO = {product: productDO, history: historyDO};

			if (existProduct !== undefined) {
				const priceChange = productInfo.price - existProduct.price;
				if (priceChange !== 0) {
					productDO.setPriceChange(priceChange);
					productDO.setPriceChangePercent(productDO.price_change/(existProduct.price==0?0.1:existProduct.price));
				} else {
					combinedDO = {};
				}
			}
			return combinedDO;
		});

		taskChain = taskChain.catch( (error) => {
			return Promise.reject({message: 'UpdateController.createDO: ' + error.message})
		});

		return taskChain;
	} catch(e) {
		console.log(e);
		return Promise.reject({message: 'UpdateController.createDO(exception):' + e.message});
	}
}

UpdateController.updateSolr = function(productDO, historyDO) {
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
		return Promise.reject({ message: 'UpdateController.updateSolr: ' + error.message });
	});	
}

