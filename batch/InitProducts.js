require("./base");

var InitProducts = InitProducts || {}; // namespace

// Properties
InitProducts.requiredArgs = [];
InitProducts.helpMessage = "Usage: InitProducts [options]\n" +
		"Where [options] can be:\n" +
		"  -?              : show help\n" +
		"  -l=<file name>  : (required)product list file\n";
InitProducts.productListFileName = "";

// Methods
InitProducts.parseParameters = function() {
	const args = require("minimist")(process.argv.slice(2));

	for (let arg in this.requiredArgs) {
		if (args[this.requiredArgs[arg]] === undefined) {
			return this.helpMessage;
		}
	}
	// this.productListFileName = args.l;

	return true;
}

InitProducts.getSiteMap = function() {
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
		return productFiles;
	})
	.catch( (error) => {
		console.log(error);
		return [];
	})

}

InitProducts.getProductPageList = function(urls) {
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
		return list;
	});
}

InitProducts.addProducts = function(pageUrls) {
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
		return result;
	});
}

InitProducts.downloadList = function(urls) {
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

			console.log('Process ' + url);
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

InitProducts.saveProducts = function(urls) {
	let resultList = {success:[], fail:[]};
	let taskChain = Promise.resolve();

	for (let i in urls) {
		const url = urls[i];

		taskChain = taskChain.then( () => {
			const apiUrl = loadConfig('api').productIndexAPI + require('querystring').escape(url);
			return load('common.Curl').get(apiUrl, 10000);
		})
		.then( (httpReturn) => {
			console.log('Save ' + url);
			const jsonReturn = JSON.parse(httpReturn.data);
			if (jsonReturn.status) {
				resultList.success.push(url);
			} else {
				resultList.fail.push(url);
			}
			return resultList;
		})
		.catch( (error) => {
			console.log(error);
			// resultList.fail.push(url);
		});
	}

	return taskChain;
}

InitProducts.run = function() {
	const result = this.parseParameters();
	if (result !== true) {
		console.log(result);
		return;
	}

	this.getSiteMap()
	.then(this.getProductPageList.bind(this))
	.then(this.addProducts.bind(this))
	.then( (results) => {
		const successList = results.success;
		const failList = results.fail;
		console.log('Success:' + successList.length + ' Fail:' + failList.length);
	})
	.catch( (error) => {
		console.log(error);
	})
}

InitProducts.run();


