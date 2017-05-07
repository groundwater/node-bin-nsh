#!/usr/bin/env node

var Nsh = require('.')


Nsh([process.stdin, process.stdout, process.stderr])
.on('SIGINT', function()
{
  this.write('^C')
  this.clearLine()

  this.prompt()
})
