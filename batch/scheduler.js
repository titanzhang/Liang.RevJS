
module.exports = new JobScheduler();

function JobScheduler() {
	this.jobList = [];
}

JobScheduler.prototype.register = function(month, date, hour, minute, name, job) {
	this.jobList.push({
		name: name,
		checkTime: this.onTime(month, date, hour, minute),
		job: job
	});
	load('common.Utils').log('JobScheduler', 'register ' + name);
	// console.log("JobScheduler: register " + name);
}

JobScheduler.prototype.onTime = function(month, date, hour, minute) {
	const self = this;
	const checkTime = function(currentTime) {
		return self.matchTime(currentTime.getMinutes(), minute) &&
			self.matchTime(currentTime.getHours(), hour) &&
			self.matchTime(currentTime.getDate(), date) &&
			self.matchTime(currentTime.getMonth()+1, month);
	}
	return checkTime;
}

JobScheduler.prototype.matchTime = function(current, setting) {
	// 1,2,3
	if (setting.search(',') >= 0) {
		const timeList = setting.split(',');
		for (let i in timeList) {
			if (parseInt(timeList[i]) === current) {
				return true;
			}
		}
		return false;
	}

	// * or */3
	const regexp=/([*])[ ]*([/]*)[ ]*(.*)/;
	const matches = regexp.exec(setting);
	if (matches !== null) {
		let num = parseInt(matches[3]);
		num = (Number.isNaN(num))? 1: num;
		return (current % num === 0);
	}

	// single number
	return (current === parseInt(setting));
}

JobScheduler.prototype.execute = function() {
	const currentTime = new Date();
	for (let i in this.jobList) {
		const jobSetting = this.jobList[i];
		if (jobSetting.checkTime(currentTime)) {
			setTimeout(jobSetting.job, 0);
			load('common.Utils').log('Start job', jobSetting.name);
			// console.log('[' + currentTime.toLocaleString('en-US', {hour12:false}) + ']' + ' Start job:' + jobSetting.name);
		}
	}
}

JobScheduler.prototype.execNow = function(jobName) {
	const currentTime = new Date();
	for (let i in this.jobList) {
		const jobSetting = this.jobList[i];
		if (jobSetting.name === jobName) {
			setTimeout(jobSetting.job, 0);
			load('common.Utils').log('execNow', jobSetting.name);
			// console.log('[' + currentTime.toLocaleString('en-US', {hour12:false}) + ']' + ' execNow: ' + jobSetting.name);
			break;
		}
	}
}

JobScheduler.prototype.run = function() {
	setInterval(this.execute.bind(this), 60*1000);
}
