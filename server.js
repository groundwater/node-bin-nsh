#!/usr/bin/env node

const readFile = require('fs').readFile

const concat = require('concat-stream')

const Nsh = require('.')


const stdio = [process.stdin, process.stdout, process.stderr]


function eval(data)
{
  // Re-adjust arguments
  process.argv = process.argv.concat(argv)

  Nsh.eval(stdio, data, function(error)
  {
    if(error) onerror(error)
  })
}

function onerror(error)
{
  console.error(process.argv0+': '+error)
  process.exit(2)
}


const argv = process.argv.slice(2)
process.argv = [process.argv[1]]

switch(argv[0])
{
  case '-c':
    argv.shift()

    const command_string = argv.shift()
    if(!command_string) return onerror('-c requires an argument')

    const command_name = argv.shift()
    if(command_name) process.argv[0] = command_name

    return eval(command_string)

  case '-s':
    argv.shift()

    return process.stdin.pipe(concat(function(data)
    {
      eval(data.toString())
    }))
    .on('error', onerror)
  break

  default:
    const command_file = argv.shift()
    if(command_file)
      return readFile(command_file, function(error, data)
      {
        if(error) return onerror(error)

        (data)
      })
}


//
// Start an interactive shell
//

// Re-adjust arguments
process.argv = process.argv.concat(argv)

Nsh(stdio)
.on('SIGINT', function()
{
  this.write('^C')
  this.clearLine()

  this.prompt()
})
