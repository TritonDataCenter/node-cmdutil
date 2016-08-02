# node-cmdutil: common command-line program functions

This module provides a few functions that are useful for command-line programs
written in Node.

* [warn(...)](#warn): print a warning message to stderr
* [fail(...)](#fail): print a warning message to stderr and exit
* [usage(...)](#usage): print a usage message to stderr and exit
* [exitOnEpipe](#exitOnEpipe): exit normally (with status 0) when EPIPE is seen
  on stdout.  This causes Node programs to behave like other programs do by
  default on most Unix-like systems.  See details below.
* [confirm](#confirm): print a message to stdout, read one byte of input from
  stdin, and test whether it appears affirmative

You should also check out:

* [node-getopt](https://github.com/davepacheco/node-getopt) for POSIX option
  parsing
* [node-tab](https://github.com/davepacheco/node-tab) for reading and writing
  tables similar to other Unix tools
* [node-verror](https://github.com/davepacheco/node-verror) for constructing
  error chains that produce useful messages for command-line tools
* [node-extsprintf](https://github.com/davepacheco/node-extsprintf) for Node.js
  analogs to printf(), fprintf(), and sprintf().
* [node-cmdln](https://github.com/trentm/node-cmdln) for an alternative
  framework for building command-line programs


# Functions

The interfaces here follow [Joyent's Best Practices for Error Handling in
Node.js](https://www.joyent.com/developers/node/design/errors).

All of the functions here except for `confirm()` are synchronous.  None of the
functions in this module emit operational errors.  The only possible errors are
invalid arguments, which are programmer errors.  These are thrown and should not
be handled.


## warn(...)

`warn(...)` emits a warning message to stderr in the same format as most other
Unix tools, which is that the warning message is prefixed with the program name.
See configure() below.

You can supply arguments in one of two ways.

    warn(err)
    warn(fmtstr, arg0, arg1, ...)

* If the first argument is an instance of Error, then the message printed will
  be `err.message`.
* Otherwise, all arguments will be passed directly to node-extsprintf's
  `sprintf` function.  This works similar to Node's `util.format`, but it
  supports many more format specifiers and it's stricter about null and
  undefined types.

For example, this test program called "warn.js" produces:

```javascript
var cmdutil = require('../lib/cmdutil');
cmdutil.warn('test message');
```

produces:

```
warn.js: test message
```

This program:

```javascript
cmdutil.warn('bad argument: "%s"', -5);
```

produces:

```
warn.js: bad argument: "-5"
```

And here's an example using an Error:

```javascript
cmdutil.warn(new Error('bad input'));
```

which produces:

```
warn.js: bad input
```

You can change the program name that gets printed using `configure()`:

```javascript
cmdutil.configure({
    'progname': 'myprog'
});
cmdutil.warn('test message');
```

which prints:

```
myprog: test message
```


## fail(...)

`fail(...)` emits a warning message just like `warn(...)`, but then exits the
process using `process.exit()`.

The arguments are exactly like `warn(..)`, but you may specify an _optional_
numeric first argument that indicates the exit status to pass to
`process.exit()`.  If you don't specify one, the exit status `1` is used.

    fail(err)                             /* will exit with status 1 */
    fail(fmtstr, arg0, arg1, ...)         /* will exit with status 1 */
    fail(status, err)                     /* will exit with status "status" */
    fail(status, fmtstr, arg0, arg1, ...) /* will exit with status "status" */

The easiest thing is to just pass an Error:

```
cmdutil.configure({ 'progname': 'myprog' });
cmdutil.fail(new Error('something went wrong');
/* This code is never reached. */
```

which outputs:

```
$ node examples/fail-error.js 
myprog: something went wrong
$ echo $?
1
```

You can use [node-verror](https://github.com/davepacheco/node-verror) to chain
together messages:

```javascript
var cmdutil = require('../lib/cmdutil');
var fs = require('fs');
var VError = require('verror');

cmdutil.configure({ 'progname': 'myprog' });
try {
        fs.statSync('/nonexistent_file');
} catch (ex) {
        cmdutil.fail(new VError(ex, 'something went wrong'));
        /* This code is never reached. */
}
```

This outputs:

```
$ node examples/fail-verror.js 
myprog: something went wrong: ENOENT, no such file or directory '/nonexistent_file'
$ echo $?
1
```

Just like with `warn()`, you can instead pass printf-style args:

```javascript
var cmdutil = require('../lib/cmdutil');
cmdutil.configure({ 'progname': 'myprog' });
cmdutil.fail('something %s went wrong', 'very bad');
/* This code is never reached. */
```

produces:

```
$ node examples/fail-printflike.js 
myprog: something very bad went wrong
$ echo $?
1
```

As mentioned above, with either invocation, you can specify a leading number to
use as the exit status instead of the default status of `1`:

```javascript
var cmdutil = require('../lib/cmdutil');
cmdutil.configure({ 'progname': 'myprog' });
cmdutil.fail(7, 'something %s went wrong', 'very bad');
/* This code is never reached. */
```

which does this:

```
$ node examples/fail-status.js 
myprog: something very bad went wrong
$ echo $?
7
```

## usage()

usage() does several things, in order:

* prints an optional warning message
* prints one or more synopses representing different ways to invoke your program
* prints a message of additional usage information
* exits with status `2` (as is standard for usage errors)

The synopses and additional usage information are whatever was last passed to
`configure()`.  You must have previously called `configure()` with valid values
for these.

If you invoke usage() with no arguments, then only the usage message is printed.
If you pass arguments, they're treated exactly as they are for `warn()`: they
can be an Error or a series of printf-like arguments.  These are used to
construct an error message that's printed to stderr before the warning message.

Here's an example:

```javascript
cmdutil.configure({
    'progname': 'myprog',
    'usageMessage': 'Fetch or update the contents of a remote URL.',
    'synopses': [
        'fetch  [-v] URL',
        'upload [-v] URL FILENAME'
    ]
});
cmdutil.usage();
/* This code is never reached. */
```

and here's what it prints out:

```
$ node examples/usage.js 
usage: myprog fetch  [-v] URL
       myprog upload [-v] URL FILENAME
Fetch or update the contents of a remote URL.
$ echo $?
2
```

You can also use the usual `warn()`-like arguments to print a warning message:

```javascript
cmdutil.configure({
    'progname': 'myprog',
    'usageMessage': 'Fetch or update the contents of a remote URL.',
    'synopses': [
        'fetch  [-v] URL',
        'upload [-v] URL FILENAME'
    ]
});
cmdutil.usage(new Error('no URL specified'));
/* This code is never reached. */
```

which prints:

```
$ node examples/usage-warn.js 
myprog: no URL specified
usage: myprog fetch  [-v] URL
       myprog upload [-v] URL FILENAME
Fetch or update the contents of a remote URL.
```


## configure(args)

`configure(args)` takes arguments as named properties of `args`.  Supported
properties are:

* `synopses`: an array of strings that are used in the `usage()` output.  See
  `usage()` below.
* `usageMessage`: a string message that is used when you call `usage(...)`.  See
  `usage()` below.
* `progname`: a string used as the program name in warning messages.  If
  unspecified, the program name is taken by applying Node's `path.basename`
  function on `process.argv[1]`.

The only time you _need_ to call this function is if you're going to use the
`usage()` function later, and in that case you must specify `usageMessage` and
`synopses`.  If you specify either of these, you must also specify the other.
If you call this function multiple times, only the last values for any of the
above properties will be used.


## exitOnEpipe()

This function causes an EPIPE error on `process.stdout` to to exit the program
immediately with status 0, using `process.exit(0)`.  This makes a Node program
behave like most other programs on Unix-like systems.  Any other errors on
`stdout` will be thrown with `throw`, so these errors will be uncatchable.  Do
not use this function if you intend to handle other errors on stdout.

This function takes no arguments and produces no errors.

**Background**: By default, on Unix-like systems, programs automatically exit
with status 0 when they receive SIGPIPE.  This behavior supports the common
pattern of piping one command into another but having the first program
terminate if the second program terminates.  For example, if you generate many
lines of output and pipe it to `head(1)`:

    # yes | head
    y
    y
    y
    y
    y
    y
    y
    y
    y
    y
    #

then this works as you'd expect: the `yes` program exits when this happens,
even though `yes` normally runs until you explicitly stop it.  We can see
what's going on using `strace` or `truss`:

    # truss -t write yes | head
    y
    y
    y
    y
    y
    y
    y
    y
    y
    y
    write(1, " y\n y\n y\n y\n y\n y\n".., 5120)    = 5120
    write(1, " y\n y\n y\n y\n y\n y\n".., 5120)    Err#32 EPIPE
        Received signal #13, SIGPIPE [default]

We see that the `yes` process got EPIPE from the second `write(2)` system call,
and that resulted in a `SIGPIPE` being delivered.  The default disposition of
`SIGPIPE` is to cause the process to exit with status 0.  This is one of those
behind-the-scenes mechanisms that makes the Unix shell work the way you'd
expect.

By default, this doesn't happen with Node programs.  Instead, Node crashes on
the `EPIPE` from `write(2)`:

    # node -e 'function tick() { console.log("y"); } setInterval(tick, 1000);' | sleep 3
    
    events.js:72
            throw er; // Unhandled 'error' event
                  ^
    Error: write EPIPE
        at errnoException (net.js:907:11)
        at Object.afterWrite (net.js:723:19)
    # 

When this happens, the status code is non-zero, though you have to `set -o
pipefail` in your shell to see that in this example.  This happens because Node
explicitly ignores `SIGPIPE` and then emits errors like `EPIPE` on the
appropriate stream object.  For stdout (and possibly stderr), this is almost
certainly not what you want.

Calling `exitOnEpipe()` adds an `'error'` listener to `process.stdout` that
checks whether the error is for `EPIPE`.  If so, it calls `process.exit(0)`.
If not, it throws the error.  It would be better to propagate it in a way that
could be handled, but there's not a great way to do this from this context, and
it's uncommon that people intend to handle other errors on stdout anyway.


## confirm(args, callback)

`confirm(args, callback)` emits a message to stdout, waits for the user to input
a single byte (in raw mode, if it's a TTY), and invokes `callback` with a
boolean value indicating whether the confirmation was either "y" or "Y" (for
"yes").  Any other response (including end-of-stream or a blank line) is
considered false.

The only supported argument inside `args` is:

* `message`: the message to print to stdout (verbatim)

`callback` is invoked as `callback(result)`.  `result` is a boolean indicating
whether the user input was affirmative.  There are no operational errors for
this function.  Callers are expected to handle errors on stdin if desired.

This function uses stdin and stdout directly, so callers should take care to
avoid using it in contexts where that's not appropriate (e.g., in a program that
reads data on stdin or produces formatted data on stdout).  The behavior is
undefined if stdin has already emitted 'end' when this function is called.


# Contributions

Contributions welcome.  Code should be "make prepush" clean.  To run "make
prepush", you'll need these tools:

* https://github.com/davepacheco/jsstyle
* https://github.com/davepacheco/javascriptlint

If you're changing something non-trivial or user-facing, you may want to submit
an issue first.
