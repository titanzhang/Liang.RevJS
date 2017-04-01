module.exports = function(request, response) {
	// Query format:
	// ?q=keyword&ppl=priceLow&pph=priceHigh&start=rowStart&rows=numRows

	const controller = new SearchController(request);
	controller.search()
	.then( (products) => {
		response.render('search', {query: controller.query, products: products, pagination: controller.buildPagination()});
	})
	.catch( (error) => {
		response.render('search', {query: controller.query, products: [], pagination: controller.buildPagination()});
		// response.send({
		// 	status: false,
		// 	error: error.message
		// })
	});
};

function SearchController(request) {
	this.baseUrl = '/product/search';
	this.query = this.normalizeQuery(request);

	this.keyword = this.query.q;
	this.pricePLow = ((this.query.ppl === '*')?'*':(this.query.ppl/100));
	this.pricePHigh = ((this.query.pph === '*')?'*':(this.query.pph/100));
	// this.priceChangePercent = "[" + ((this.query.ppl === '*')?'*':(this.query.ppl/100)) + ' TO ' + ((this.query.pph === '*')?'*':(this.query.pph/100)) + "]";
	this.startIndex = Number(this.query.start);
	this.numRows = Number(this.query.rows);
}

SearchController.prototype.normalizeQuery = function(request) {
	let query = {};
	query.q = (request.query.q === undefined || request.query.q === "")? "*": request.query.q;
	query.ppl = (request.query.ppl === undefined || request.query.ppl === "")? "*": request.query.ppl;
	query.pph = (request.query.pph === undefined || request.query.pph === "")? "*": request.query.pph;
	query.start = (request.query.start === undefined || request.query.start === "")? '0': request.query.start;
	query.rows = (request.query.rows === undefined || request.query.rows === "")? '20': request.query.rows;
	return query;
};

SearchController.prototype.buildPagination = function() {
	const constrains = '?q=' + this.query.q + '&ppl=' + this.query.ppl + '&pph=' + this.query.pph;
	const prevIndex = this.startIndex - this.numRows;
	const nextIndex = this.startIndex + this.numRows;
	const first = '&start=0';
	const prev = (prevIndex >= 0)? '&start=' + prevIndex: '';
	const next = (this.numRows == this.numRowsReturn)? '&start=' + nextIndex: '';

	let pagination = {first: this.baseUrl + constrains + first + '&rows=' + this.query.rows};
	if (prev !== '') {
		pagination.previous = this.baseUrl + constrains + prev + '&rows=' + this.query.rows;
	}
	if (next !== '') {
		pagination.next = this.baseUrl + constrains + next + '&rows=' + this.query.rows;
	}
	return pagination;
};

SearchController.prototype.search = function() {
	return load('web.domain.SolrProduct').DAO.getListByKeywordPriceP(
		this.keyword,
		this.pricePLow,
		this.pricePHigh,
		this.startIndex,
		this.numRows)
	.then( (products) => {
		this.numRowsReturn = products.length;
		const utils = load('common.Utils');
		for (let i in products) {
			products[i].title = utils.truncate(products[i].title, 55, ' ...');
		}
		return products;
	})
	.catch( (error) => {
		return Promise.reject(error);
	});
};