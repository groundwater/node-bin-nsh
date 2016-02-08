#!/usr/bin/env node

var createInterface = require('readline').createInterface

var decode = require('decode-prompt')
var parse  = require('shell-parse')

var completer    = require('./lib/completer')
var environment  = require('./lib/ast2js/_environment')
var execCommands = require('./lib/ast2js/_execCommands')


var rl = createInterface(
{
  input: process.stdin,
  output: process.stdout,
  completer: completer
})


var input = ''

function prompt(smallPrompt)
{
  if(smallPrompt)
    var ps = environment.get('PS2')

  else
  {
    input = ''

    var ps = environment.get('PS1')
  }

  rl.setPrompt(decode(ps, {env: process.env}))

  rl.prompt()
}

function onError(error)
{
  console.error(error)

  return prompt()
}


prompt()

rl.on('line', function(line)
{
  input += line

  if(input === '') return prompt()

  try
  {
    var commands = parse(input)
  }
  catch(error)
  {
    if(error.constructor !== parse.SyntaxError) return onError(error)

    line = input.slice(error.offset)

    try
    {
      parse(line, 'continuationStart')
    }
    catch(error)
    {
      return onError(error)
    }

    return prompt(true)
  }

  execCommands(this, commands, function(error)
  {
    if(error) console.error(error)

    prompt()
  })
})

rl.on('SIGINT', function()
{
  this.write('^C')
  this.clearLine()

  prompt()
})
