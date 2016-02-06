#!/usr/bin/env node

var createInterface = require('readline').createInterface

var parse = require('shell-parse')

var completer    = require('./lib/completer')
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
  input = ''

  rl.setPrompt(smallPrompt ? '> ' : process.cwd()+'> ')
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
