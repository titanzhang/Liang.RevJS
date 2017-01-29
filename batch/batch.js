require('./base.js');
var scheduler = load('batch.scheduler');

// month, date, hour, minute
scheduler.register('*', '*', '4', '5', 'UpdatePrice', load('batch.job.UpdatePrice'));

// scheduler.register('*', '*', '*', '*', 'test', function() {
// 	console.log('test');
// });

scheduler.run();