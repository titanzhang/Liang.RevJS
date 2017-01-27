var HistoryDAO = {
	serverName: 'history'
};

HistoryDAO.add = function(history) {
	try {
		const server = load('web.domain.Solr').manager.getServer(this.serverName);

		let taskChain = server.update([history]);
		taskChain = taskChain.then( (solrReturn) => {
			return history;
		});

		taskChain = taskChain.catch( (error) => {
			return Promise.reject({ message: 'HistoryDAO.add: ' + error.message});
		});

		return taskChain;
	} catch(e) {
		return Promise.reject({ message: 'HistoryDAO.add(exception): ' + error.message });
	}
}

HistoryDAO.getListByHash = function(hash) {
	try {
		const server = load('web.domain.Solr').manager.getServer(this.serverName);
		const searchTerm = 'hash:' + hash;

		return server.query({q: searchTerm})
			.then( (solrReturn) => {
				return solrReturn.data.response.docs;
			})
			.catch( (error) => {
				return Promise.reject({message: 'HistoryDAO.getListByHash: ' + error.message})
			})

	} catch(e) {
		console.log(e);
		return Promise.reject({ message: 'HistoryDAO.getListByHash(exception): ' + error.message });
	}
}

function HistoryDO() {
	this.hash = '';
	this.price = 0.0;
	this.date = (new Date()).getTime();
}

HistoryDO.prototype.setHash = function(hash) {
	this.hash = hash;
	return this;
}

HistoryDO.prototype.setPrice = function(price) {
	this.price = price;
	return this;
}

HistoryDO.prototype.setDate = function(date) {
	this.date = date;
	return this;
}

exports.DO = HistoryDO;
exports.DAO = HistoryDAO;