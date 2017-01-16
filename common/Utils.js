var Utils = Utils || {};

Utils.parseXML = function(content) {
	var xml = {};
	var XML2JS = require("xml2js");
	XML2JS.parseString(content, function(err, result) {
		xml = result;
	});
	return xml;
}

Utils.removeHTMLTags = function(html) {
	var regexp = /<[^>]*>/g;
	return html.replace(regexp, "");
}

Utils.deepReplace = function(pattern, rep, text) {
	var oldLength = text.length;
	var string = text.replace(pattern, rep);
	var newLength = string.length;

	while (oldLength !== newLength) {
		oldLength = string.length;
		string = string.replace(pattern, rep);
		newLength = string.length;
	}
	return string;
}

// exports = Utils;
exports.parseXML = Utils.parseXML;
exports.removeHTMLTags = Utils.removeHTMLTags;
exports.deepReplace = Utils.deepReplace;

