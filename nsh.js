#!/usr/bin/env node

var rl = require('readline');

var repl = require("repl");

var shellUtils = require('./shellUtils');
var completer  = shellUtils.completer;
var readline   = shellUtils.readline;


// Main method
if(!module.parent){
  function prompt(){
    var prefix;
    try {
      prefix = process.cwd();
    } catch (e) {
      prefix = "(none)";
    }
    return prefix + " # ";
  };

  var replserver = repl.start(
  {
    prompt: prompt(),
    eval: function(cmd, context, filename, callback)
    {
      // Hack for REPL
      if(cmd[0] == '(') return callback(new SyntaxError);

      readline(cmd, function(error, result)
      {
        callback(error, result);
      });
    }
  });

  var displayPrompt = replserver.displayPrompt;
  replserver.displayPrompt = function(){
    replserver.prompt = prompt();
    displayPrompt.call(this);
  };

  replserver.complete = completer;
}
