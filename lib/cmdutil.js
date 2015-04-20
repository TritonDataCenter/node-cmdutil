/*
 * lib/cmdutil.js: common command-line library functions
 */

var mod_assertplus = require('assert-plus');
var mod_extsprintf = require('extsprintf');
var mod_path = require('path');

var sprintf = mod_extsprintf.sprintf;

/* Public interface */
exports.progname = progname;
exports.configure = configure;
exports.usage = usage;
exports.warn = warn;
exports.fail = fail;

var usageMessage = null;
var progname = mod_path.basename(process.argv[1]);
var synopses = null;

function configure(args)
{
	mod_assertplus.object(args, 'args');
	mod_assertplus.ok(args !== null);
	mod_assertplus.optionalString(args.usageMessage, 'args.usageMessage');
	mod_assertplus.optionalString(args.progname, 'args.progname');
	mod_assertplus.optionalArrayOfString(args.synopses, 'args.synopses');

	if (typeof (args.progname) == 'string') {
		progname = args.progname;
	}

	if (typeof (args.usageMessage) == 'string') {
		mod_assertplus.ok(args.synopses,
		    'cannot specify a usage message without synopses');
		usageMessage = args.usageMessage;
	}

	if (args.synopses) {
		mod_assertplus.equal(typeof (args.usageMessage), 'string',
		    'cannot specify synopses without a usage message');
		mod_assertplus.ok(args.synopses.length > 0,
		    'there must be at least one synopsis');
		synopses = args.synopses.slice(0);
	}
}

function usage()
{
	var args;

	mod_assertplus.ok(usageMessage !== null,
	    'cannot call usage() without configuring usage message');
	mod_assertplus.ok(synopses !== null,
	    'cannot call usage() without configuring synopses');

	if (arguments.length > 0) {
		args = Array.prototype.slice.call(arguments);
		emitWarning(args);
	}

	synopses.forEach(function (syn, i) {
		if (i === 0) {
			console.error('usage: %s %s', progname, syn);
		} else {
			console.error('       %s %s', progname, syn);
		}
	});

	console.error(usageMessage);
	process.exit(2);
}

function emitWarning(args)
{
	var msg;

	if (args.length > 0 && args[0] instanceof Error) {
		msg = args[0].message;
	} else {
		msg = sprintf.apply(null, args);
	}

	console.error('%s: %s', progname, msg);
}

function warn()
{
	emitWarning(Array.prototype.slice.call(arguments));
}

function fail()
{
	var args;
	var status = 1;

	args = Array.prototype.slice.call(arguments);
	if (typeof (args[0]) == 'number') {
		status = args[0];
		args = args.slice(1);
	}

	emitWarning(args);
	process.exit(status);
}
