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


prompt()

rl.on('line', function(line)
{
  input += line

  if(input === '') return prompt()

  try
  {
    var ast = parse(input)
  }
  catch(err)
  {
    if(err.constructor !== parse.SyntaxError) throw err

    line = input.slice(err.offset)

    try
    {
      parse(line, 'continuationStart')
      return prompt(true)
    }
    catch(err)
    {
      throw err
    }
  }

  execCommands(this, ast, function(error)
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
