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

  if (!item) return callback(1);

  if (split.length === 0) ps(item, execinfo_path, function (err, execs) {
    callback(err, [execs, item]);
  });

  else pc(item, function (err, arr, info) {
    callback(err, [arr, info.file]);
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
