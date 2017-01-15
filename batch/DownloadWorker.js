var Worker = function(workerID, jobCallback, endCallback, callbackObj) {
	this.ID = workerID;
	this.jobList = [];
	this.onSingleDone = jobCallback;
	this.onAllDone = endCallback;
	this.callbackObject = callbackObj;
	this.jobIndex = 0;
}

Worker.prototype.addJob = function(url, jobID) {
	this.jobList.push({
		url: url,
		id: jobID,
		status: 0
	});
}

Worker.prototype.curlCallback = function(statusCode, content, headers) {
	var job = this.jobList[this.jobIndex];
	this.onSingleDone.call(this.callbackObject, this.ID, (statusCode == 200), job.url, job.id, content);

	this.jobIndex ++;
	if (this.jobIndex < this.jobList.length) {
		var utils = load("common.Utils");
		utils.curlGetAsync(job.url, 10, this.curlCallback, this);
	} else {
		this.onAllDone.call(this.callbackObject, this.ID);
	}
}

Worker.prototype.run = function() {
	this.jobIndex = 0;
	var job = this.jobList[this.jobIndex];

	var utils = load("common.Utils");
	utils.curlGetAsync(job.url, 10, this.curlCallback, this);
}

exports.Worker = Worker;