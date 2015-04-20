var cmdutil = require('../lib/cmdutil');
cmdutil.configure({ 'progname': 'myprog' });
cmdutil.fail('something %s went wrong', 'very bad');
throw (new Error('reached unreachable code!'));
