require('./base.js');

if (process.argv[2] === 'debug') {
	setTimeout(load('batch.job.UpdateAll'), 0);
} else {
	var scheduler = load('batch.scheduler');

	// month, date, hour, minute
	scheduler.register('*', '*', '4', '5', 'UpdatePrice', load('batch.job.UpdatePrice'));
	scheduler.register('*', '1,15', '4', '5', 'UpdateAll', load('batch.job.UpdateAll'));
	
	scheduler.run();
}
