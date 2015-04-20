#
# Copyright (c) 2015, Joyent, Inc. All rights reserved.
#
# Makefile: top-level Makefile
#
# This Makefile contains only repo-specific logic and uses included makefiles
# to supply common targets (javascriptlint, jsstyle, restdown, etc.), which are
# used by other repos as well.
#

#
# Tools
#
CATEST		 = tools/catest
NPM		 = npm

#
# Files
#
BASH_FILES	 = $(wildcard test/*.sh)
JS_FILES	:= $(shell find lib examples test -name '*.js')
JSL_FILES_NODE	 = $(JS_FILES)
JSSTYLE_FILES	 = $(JS_FILES)
JSL_CONF_NODE	 = tools/jsl.node.conf

.PHONY: all
all:
	$(NPM) install

.PHONY: test
test:
	$(CATEST) -a

include ./Makefile.targ
