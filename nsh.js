#!/usr/bin/env node

var fs     = require('fs');
var glob   = require('glob');
var path   = require('path');
var rl     = require('readline');
var cp     = require('child_process');
var parse  = require('lib-cmdparse');
var ps     = require('lib-pathsearch');
var pc     = require('lib-pathcomplete');

var state  = {
  "?" : null
}

var execinfo_path = process.env.PATH.split(':');

// auto-complete handler
function completer (line, callback) {
  var split = line.split(/\s+/);
  var item  = split.pop();
  var outs  = [];

  // avoid crazy auto-completions when the line is empty
  if (!line) return callback(1);

  // user is attempting to type a relative directory
  var is_rel   = item[0] === '.';

  // user is typing first command
  var is_first = split.length === 0;

  // if this is the first token on the line
  // autocomplete it against commands in the search path
  if (!is_rel && is_first) ps(item, execinfo_path, function (err, execs) {
    // if there is only one executable, append a space after it
    if (execs.length === 1) execs[0] = execs[0] + ' ';
    callback(err, [execs, item]);
  });

  // if this is 
  else pc(item, function (err, arr, info) {
    // if there is only one completion, and it's a directory
    // automatically append a '/' to the completion
    if (arr.length === 1) {
      if (fs.statSync(info.dir + arr[0]).isDirectory()) 
        callback(err, [[arr[0] + '/'], info.file]);
      else callback(err, [arr, info.file]);
    }
    else callback(err, [arr, info.file]);
  });

}

var iface = rl.createInterface({
  input     : process.stdin,
  output    : process.stdout,
  completer : completer
});

// visually indicate closed pipe with ^D
// otherwise exiting nested shells is confusing
iface.on('close', function () {
  process.stdout.write('^D\n');
});

// handle ^C like bash
iface.on('SIGINT', function () {
  process.stdout.write('^C\n');
  prompt();
});

function readline(line){
  line = interpolate(line.trim(), process.env);
  line = interpolate(line, state);

  if (line && line.length > 0) {
    if (line.substring(0,2) === 'cd'){
      // cd is a native command
      var dir = line.substring(2).trim();
      if (dir.length === 0) dir=process.env.HOME;

      // should not crash process with a bad 'cd'
      try {
        process.chdir(dir);
      } catch (e) {
        console.log(e);
      }

      setImmediate(prompt);
    }else{
      // other commands
      run(line);
    }
  } else {
    setImmediate(prompt);
  }
}

process.on('close',function(){
  process.exit(0);
});

// replace $VARs with environment variables
function interpolate(string, replace){
  return string.replace(/\$[^\s]+/g, function (key){
    var name = key.substring(1);
    
    var out;
    if(replace[name] || replace[name] === 0){
      out = replace[name];
    } else { 
      out = key;
    }

    return out;
  });
}

function run(line){  
  // allow for setting environment variables
  // on the command line
  var stanza = parse(line);

  // fallback to current environment
  stanza.envs.__proto__ = process.env;

  // We must stop reading STDIN because we will soon
  // be the background process group, which will raise
  // errors when attempting to read/write to the TTY driver
  process.stdin.pause();
  
  // Sub-Process
  var args = stanza.args;
  var exec = stanza.exec;
  var proc = cp.spawn(exec,args,{
    cwd: process.cwd(),
    env: stanza.envs,
    
    // Inerit the terminal
    stdio: 'inherit'
  });
  
  // Have this shell resume control after the sub-process exists
  function res(){
    process.stdin.resume();
    prompt();
  }
  
  // catch exit code
  function end(code, signal){
    // the $? variable should contain the exit code
    state["?"] = code;
    state["??"] = signal;

    res();
  }
  
  // catch errors
  function err(err){
    res();
  }
  
  proc.on('error', err);
  proc.on('exit', end); 
}

function prompt(){
  var prefix;
  try {
    prefix = process.cwd();
  } catch (e) {
    prefix = "(none)";
  }
  iface.question(prefix + " # ", function (line) {
    readline(line);
  });
}

// Main method
if(!module.parent){
  prompt();
}
