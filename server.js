#!/usr/bin/env node

const Nsh = require('.')


function onerror(error)
{
  console.error(process.argv0+': '+error)
  process.exit(2)
}


const stdio = [process.stdin, process.stdout, process.stderr]

const argv = process.argv.slice(2)
if(argv.shift() === '-c')
{
  if(!argv.length) return onerror('-c requires an argument')

  return Nsh.eval(stdio, argv.join(' '), function(error)
  {
    if(error) onerror(error)
  })
}


Nsh(stdio)
.on('SIGINT', function()
{
  this.write('^C')
  this.clearLine()

  this.prompt()
})
