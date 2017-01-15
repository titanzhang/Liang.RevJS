module.exports = function(req, res) {
	// console.log(req.params.url);
	res.send(IndexController.run(req.params.url));
}

var IndexController =  IndexController || {};

IndexController.run = function(url) {
	// Download page
	var page = this.getPageContent(url);
	if (page.status === false) {
		return {
			status: false,
			error: page.error
		};
	}

	// Extract information
	var product = this.extractPage(url, page.content);
	if (product.status === false) {
		return {
			status: false,
			error: product.error
		};
	}
	console.log(product);

	// Update index

	// create return JSON
	return {
		status: true,
		result: {
			docID: "hash code",
			maxDoc: 1
		}
	};
}

IndexController.getPageContent = function(url) {
	var curlReturn = load("common.Utils").curlGet(url, 10);

	if (curlReturn.status === false || curlReturn.statusCode !== 200) {
		return {
			status: false,
			error: 'Retrieve page failed, httpCode=' + curlReturn.statusCode
		};
	}

	return {
		status: true,
		content: curlReturn.content
	};
}

IndexController.extractPage = function(url, pageContent) {
	var product = { status: true };

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
			product.status = false;
			product.error = 'Title not found in page';
			return product;
		}
		product.title = regResult[1];
	}

	// Get price
	regexp = /<meta itemprop="price" content="([^"]+)"[^>]*>/;
	regResult = regexp.exec(pageContent);
	if (regResult === null) {
		prouduct.status = false;
		product.error = 'Price not found in page';
	}
	product.price = parseFloat(regResult[1].replace('$', ''));

	return product;
}
