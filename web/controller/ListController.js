module.exports = function(req, res) {
	var renderPage = function(productList) {
		res.send({
			status: true,
			products: productList
		});
	};

	var renderError = function(error) {
		res.send({
			status: false,
			error: error.message
		})
	};

	ListController.getList(req.params.startRow, req.params.numRows)
		.then(renderPage)
		.catch(renderError);
}

var ListController = ListController || {};

// Parameters
//   startRow: start row, index begin from 0
//   numRows: number of rows to fetch
// Return
//   product list: {hash, url, price}
ListController.getList = function(startRow, numRows) {
	try {
		return load('web.domain.SolrProduct').DAO.getList(startRow, numRows)
		.then( (productList) => {
			return productList;
		})
		.catch( (error) => {
			return Promise.reject({message: 'ListController.getList: ' + e.message});
		})
	} catch(e) {
		console.log(e);
		return Promise.reject({message: 'ListController.getList(exception): ' + e.message});
	}
}