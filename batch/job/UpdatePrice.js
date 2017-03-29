module.exports = function() {
	const numRows = 10;
	const startIndex = 0;
	
	const job = new JobUpdatePrice();
	job.processProducts(startIndex, numRows)
	.then( (totalNumber) => {
		load('common.Utils').log('UpdatePrice', totalNumber + ' products updated')
		// console.log(totalNumber + ' products updated');
	})
	.catch( (error) => {
		console.log(error);
	})
}

function JobUpdatePrice() {
	this.totalNumber = 0;
}

JobUpdatePrice.prototype.processProducts = function(startIndex, numFetch) {
	try {
		return Promise.resolve().then( () => {
			return this.getProducts(startIndex, numFetch);
		})
		.then(this.updateProducts.bind(this))
		.then( (numUpdated) => {
			this.totalNumber += numUpdated;
			if (numUpdated < 1) {
				return this.totalNumber;
			} else {
				return this.processProducts(startIndex + numFetch, numFetch)
			}
		});
	} catch(e) {
		console.log(e);
		Promise.reject( {message: 'JobUpdatePrice.processProducts(exception): ' + e.message} );
	}
}

// Parameters
//   startIndex: start index, index starts from 0
//   numFetch: number of rows to fetch
// Return
//   product list: [ {hash,url,price} ]
JobUpdatePrice.prototype.getProducts = function(startIndex, numFetch) {
	try {
		const apiUrl = loadConfig('api').productListAPI + startIndex + '/' + numFetch;

		return load('common.Curl').get(apiUrl, 10000)
		.then( (httpReturn) => {
			const apiReturn = JSON.parse(httpReturn.data);
			if (!apiReturn.status) {
				return Promise.reject({message: 'JobUpdatePrice.getProducts: call list api failed'});
			}
			load('common.Utils').log('UpdatePrice', 'getProducts (' + startIndex + ', ' + numFetch + ')')
			return apiReturn.products;
		})
		.catch( (error) => {
			return Promise.reject({message: 'JobUpdatePrice.getProducts: ' + error.message});
		});
	} catch(e) {
		console.log(e);
		return Promise.reject({message: 'JobUpdatePrice.getProducts(exception): ' + e.message});
	}
}

JobUpdatePrice.prototype.updateProducts = function(productList) {
	try {
		// console.log(productList);
		if (productList.length < 1) {
			return 0;
		}

		let jobList = [];
		for (let i in productList) {
			jobList[i] = this.updateProduct(productList[i]);
		}

		return Promise.all(jobList)
		.then( (results) => {
			load('common.Utils').log('UpdatePrice', 'updateProducts ' + productList.length);
			return productList.length;
		})
		.catch( (error) => {
			return Promise.reject({message: 'JobUpdatePrice.updateProducts: ' + e.message});
		}); 
	} catch(e) {
		console.log(e);
		return Promise.reject({message: 'JobUpdatePrice.updateProducts(exception): ' + e.message});
	}
}

JobUpdatePrice.prototype.updateProduct = function(product) {
	try {
		const apiUrl = loadConfig('api').productIndexAPI + require('querystring').escape(product.url);
		return load('common.Curl').get(apiUrl, 10000)
		.then( (httpReturn) => {
			// console.log('Process ' + product.url);
			const apiReturn = JSON.parse(httpReturn.data);
			return {status: apiReturn.status};
		})
		.catch( (error) => {
			return {
				status: false,
				message: error.message
			}
		});
	} catch(e) {
		console.log(e);
		return Promise.reject({message: 'JobUpdatePrice.updateProduct(exception): ' + e.message});
	}
}


