var cmdutil = require('../lib/cmdutil');

cmdutil.configure({ 'progname': 'myprog' });
cmdutil.fail(new Error('something went wrong'));
throw (new Error('reached unreachable code!'));
