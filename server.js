#!/usr/bin/env node

var Nsh = require('./lib')


Nsh(process.stdin, process.stdout)
.on('SIGINT', function()
{
  this.write('^C')
  this.clearLine()

  this.prompt()
})
