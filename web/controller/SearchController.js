module.exports = function(request, response) {
	const keyword = request.query.q;
	const priceChangeRange = request.query.pc;
	const start = request.start;
	const numRows = request.rows;

	const controller = new SearchController(keyword, priceChangeRange, start, numRows);
	controller.search()
	.then( (products) => {
		response.send({
			status: true,
			products: products
		});
	})
	.catch( (error) => {
		response.send({
			status: false,
			error: error.message
		})
	})
}

function SearchController(keyword, priceChangeRange, start, numRows) {
	if (keyword === undefined) {
		this.keyword = '*';
	} else {
		this.keyword = keyword;
	}

	this.priceChangePercent = '[* TO *]';
	if (priceChangeRange !== undefined) {
		const regexp = /(\[|{)(.*),(.*)(\]|})/;
		const matches = regexp.exec(priceChangeRange);
		if (matches !== null) {
			this.priceChangePercent = matches[1] + matches[2] + ' TO ' + matches[3] + matches[4];
		}
	}

	this.startIndex = 0;
	if (start !== undefined) {
		this.startIndex = Number(start);
	}

	this.numRows = 10;
	if (numRows !== undefined) {
		this.numRows = Number(numRows);
	}
}

SearchController.prototype.search = function() {
	return load('web.domain.SolrProduct').DAO.getListByKeywordPriceP(
		this.keyword,
		this.priceChangePercent,
		this.startIndex,
		this.numRows)
	.then( (products) => {
		return products;
	})
	.catch( (error) => {
		return Promise.reject(error);
	});
}