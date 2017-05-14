const inherits  = require('util').inherits
const Interface = require('readline').Interface

const decode = require('decode-prompt')
const parse  = require('shell-parse')

const _completer   = require('./completer')
const environment  = require('./ast2js/_environment')
const execCommands = require('./ast2js/_execCommands')


function onError(error)
{
  console.error(error)

  return this.prompt()
}


function Nsh(stdio, completer, terminal)
{
  if(!(this instanceof Nsh)) return new Nsh(stdio, completer, terminal)

  const stdin = stdio[0]

  Nsh.super_.call(this, stdin, stdio[1],
                  (completer || completer === false) ? completer : _completer,
                  terminal)


  var self = this

  var input = ''

  function execCommandsCallback(error)
  {
    if(stdin.setRawMode) stdin.setRawMode(true)
    stdin.resume()

    if(error) console.error(error)

    self.prompt()
  }

  this.on('line', function(line)
  {
    input += line

    if(input === '') return this.prompt()

    try
    {
      var commands = parse(input)
    }
    catch(error)
    {
      if(error.constructor !== parse.SyntaxError) return onError.call(this, error)

      line = input.slice(error.offset)

      try
      {
        parse(line, 'continuationStart')
      }
      catch(error)
      {
        return onError.call(this, error)
      }

      return this.prompt(true)
    }

    if(stdin.setRawMode) stdin.setRawMode(false)
    stdin.pause()

    execCommands(stdio, commands, execCommandsCallback)
  })


  //
  // Public API
  //

  /**
   *
   */
  this.prompt = function(smallPrompt)
  {
    if(smallPrompt)
      var ps = environment['PS2']

    else
    {
      input = ''

      var ps = environment['PS1']
    }

    this.setPrompt(decode(ps, {env: environment}))

    // HACK Are these ones needed for builtins? We should remove them
    this.line = ''
    this.clearLine()

    Interface.prototype.prompt.call(this)
  }


  // Start acceoting commands
  this.prompt()
}
inherits(Nsh, Interface)


module.exports = Nsh
