require("./base");

var GetProductList = GetProductList || {}; // namespace

// Properties
GetProductList.requiredArgs = ["l"];
GetProductList.helpMessage = "Usage: GetProductList [options]\n" +
		"Where [options] can be:\n" +
		"  -?              : show help\n" +
		"  -l=<file name>  : (required)product list file\n";
GetProductList.productListFileName = "";

// Methods
GetProductList.parseParameters = function() {
	var args = require("minimist")(process.argv.slice(2));

	for (var arg in this.requiredArgs) {
		if (args[this.requiredArgs[arg]] === undefined) {
			return this.helpMessage;
		}
	}
	this.productListFileName = args.l;

	return true;
}

GetProductList.getSiteMap = function() {
	var productFiles = [];

	// Use curl to get site map
	var utils = load("common.Utils");
	var content = utils.curlGet("https://www.revzilla.com/sitemap.xml", 10);

	// Parse XML
	var xml = utils.parseXML(content);
	for (var index in xml.sitemapindex.sitemap) {
		var url = xml.sitemapindex.sitemap[index].loc[0];
		if (url.search("sitemap_products.xml") < 0) {
			continue;
		}
		productFiles.push(url);
	}

	return productFiles;
}

GetProductList.getProductPageList = function(urls) {
	var list = [];
	var utils = load("common.Utils");
	for (var index in urls) {
		var url = urls[index];
		process.stdout.write("Processing " + url + " ... ");
		var content = utils.curlGet(url, 10);
		var xmlObj = utils.parseXML(content);
		for (var index in xmlObj.urlset.url) {
			var url = xmlObj.urlset.url[index].loc[0];
			var crypto = require('crypto');
			var hash = crypto.createHash('md5').update(url).digest('hex');
			var page = {"url":url, "hash":hash};
			list.push(page);
		}
		process.stdout.write("done\n");
	}
	return list;
}

GetProductList.saveProductPageList = function(pageList) {
	var fs = require('fs');
	var fd = fs.openSync(this.productListFileName, "w");
	fs.writeSync(fd, JSON.stringify(pageList));
	// for (var key in pageList) {
	// 	var line = JSON.stringify(pageList[key]);
	// 	fs.writeSync(fd, line+"\n");
	// }
	fs.closeSync(fd);
}

// Execution
var result = GetProductList.parseParameters();
if (result !== true) {
	console.log(result);
	return;
}

var urls = GetProductList.getSiteMap();
var pageList = GetProductList.getProductPageList(urls);
GetProductList.saveProductPageList(pageList);



