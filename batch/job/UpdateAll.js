// Add new products not exsited in database
module.exports = function() {
	const job = new JobUpdateAll();
	job.run()
	.then( (results) => {
		const successList = results.success;
		const failList = results.fail;
		load('common.Utils').log('UpdateAll', 'Success=' + successList.length + ' Fail=' + failList.length)
		// console.log('Success:' + successList.length + ' Fail:' + failList.length);
	})
	.catch( (error) => {
		console.log(error);
	});
}

// Methods
function JobUpdateAll() {}

JobUpdateAll.prototype.run = function() {
	return this.getSiteMap()
	.then(this.getProductPageList.bind(this))
	.then(this.addProducts.bind(this));
}

JobUpdateAll.prototype.getSiteMap = function() {
	let productFiles = [];

	return load('common.Curl').get("https://www.revzilla.com/sitemap.xml", 10000)
	.then( (httpReturn) => {
		// Parse XML
		var xml = load('common.Utils').parseXML(httpReturn.data);
		for (var index in xml.sitemapindex.sitemap) {
			var url = xml.sitemapindex.sitemap[index].loc[0];
			if (url.search("sitemap_products.xml") < 0) {
				continue;
			}
			productFiles.push(url);
		}
		load('common.Utils').log('UpdateAll', 'getSiteMap done');
		return productFiles;
	})
	.catch( (error) => {
		console.log(error);
		return [];
	});
}

JobUpdateAll.prototype.getProductPageList = function(urls) {
	let list = [];
	const numBatch = 5;
	let chainInputs = [];

	// Init
	for (let i = 0; i < numBatch; i ++) {
		chainInputs[i] = [];
	}

	// Distribute urls into task chains
	for (let i = 0; i < urls.length; i ++) {
		const chainId = i % numBatch;
		chainInputs[chainId].push(urls[i]);
	}

	// Setup task chains
	let taskChains = [];
	for (let i in chainInputs) {
		if (chainInputs[i].length == 0) {
			continue;
		}
		taskChains[i] = this.downloadList(chainInputs[i]);
	}

	// Parallel executing
	return Promise.all(taskChains)
	.then( (urlLists) => {
		for (let i in urlLists) {
			const urlList = urlLists[i];
			list = list.concat(urlList);
		}
		load('common.Utils').log('UpdateAll', 'getProductPageList done');
		return list;
	});
}

JobUpdateAll.prototype.addProducts = function(pageUrls) {
	// console.log(pageUrls);
	const numBatch = 5;
	let chainInputs = [];

	// Init
	for (let i = 0; i < numBatch; i ++) {
		chainInputs[i] = [];
	}

	// Distribute urls into task chains
	for (let i = 0; i < pageUrls.length; i ++) {
		const chainId = i % numBatch;
		chainInputs[chainId].push(pageUrls[i]);
	}

	// Setup task chains
	let taskChains = [];
	for (let i in chainInputs) {
		if (chainInputs[i].length == 0) {
			continue;
		}
		taskChains[i] = this.saveProducts(chainInputs[i]);
	}

	// Parallel executing
	let result = {success:[], fail:[]};
	return Promise.all(taskChains)
	.then( (apiReturns) => {
		for (let i in apiReturns) {
			const apiReturn = apiReturns[i];
			result.success = result.success.concat(apiReturn.success);
			result.fail = result.fail.concat(apiReturn.fail);
		}
		load('common.Utils').log('UpdateAll', 'addProducts done');
		return result;
	});
}

JobUpdateAll.prototype.downloadList = function(urls) {
	let list = [];
	let batchChain = Promise.resolve();

	for (let i = 0; i < urls.length; i ++) {
		const url = urls[i];

		batchChain = batchChain.then( () => {
			return load('common.Curl').get(url, 10000);
		})
		.then( (httpReturn) => {
			let xmlObj = load("common.Utils").parseXML(httpReturn.data);
			for (let index in xmlObj.urlset.url) {
				const pageUrl = xmlObj.urlset.url[index].loc[0];
				list.push(pageUrl);
			}

			// console.log('Process ' + url);
			return list;
		})
		.catch( (error) => {
			// process.stdout.write("failed\n");
			console.log(error);
			return [];
		})
	}

	return batchChain;
}

JobUpdateAll.prototype.saveProducts = function(urls) {
	let resultList = {success:[], fail:[]};
	let taskChain = Promise.resolve();

	for (let i in urls) {
		const url = urls[i];

		taskChain = taskChain.then( () => {
			return this.checkProduct(url);
		})
		.then( (productExists) => {
			if (productExists) return Promise.resolve(resultList);
			
			return this.saveProduct(url)
			.then( (saveSuccess) => {
				if (saveSuccess) {
					resultList.success.push(url);
				} else {
					resultList.fail.push(url);
				}
				return resultList;
			});
		});
	}

	return taskChain;
}

JobUpdateAll.prototype.checkProduct = function(url) {
	const apiUrl = loadConfig('api').productAPI + require('querystring').escape(url);
	return load('common.Curl').get(apiUrl, 10000)
	.then( (httpReturn) => {
		const jsonReturn = JSON.parse(httpReturn.data);
		return jsonReturn.status;
	})
	.catch( (error) => {
		console.error('checkProduct: ' + error.message);
		return Promise.resolve(true);
	});
}

JobUpdateAll.prototype.saveProduct = function(url) {
	const apiUrl = loadConfig('api').productIndexAPI + require('querystring').escape(url);
	return load('common.Curl').get(apiUrl, 10000)
	.then( (httpReturn) => {
		load('common.Utils').log('UpdateAll', url);
		const jsonReturn = JSON.parse(httpReturn.data);
		return jsonReturn.status;
	})
	.catch( (error) => {
		console.error('saveProduct: ' + error.message);
		return Promise.resovle(false);
	});
}
