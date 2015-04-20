var cmdutil = require('../lib/cmdutil');

cmdutil.warn('test message');
cmdutil.warn('bad argument: "%s"', -5);
cmdutil.warn(new Error('bad input'));

cmdutil.configure({ 'progname': 'myprog' });
cmdutil.warn('test message');
console.log('okay');
