exports.product = {
	master: "http://localhost:8983/solr/product/",
	slave: [
		"http://localhost:8983/solr/product/"
	]
}

exports.history = {
	master: "http://localhost:8983/solr/history/",
	slave: [
		"http://localhost:8983/solr/history/"
	]
}