const fs     = require('fs')
const tmpdir = require('os').tmpdir

const mkfifoSync = require('mkfifo').mkfifoSync
const uuid       = require('uuid').v4

const environment  = require('./_environment')
const execCommands = require('./_execCommands')


function processSubstitution(item, callback)
{
  const path = tmpdir()+'/'+uuid()

  try
  {
    mkfifoSync(path, 0600);
  }
  catch(e)
  {
    return callback(e)
  }


  // Protect environment variables
  environment.push()

  function onExecuted(error)
  {
    stream.close()

    // Restore environment variables
    environment.pop()

    // Restore (possible) changed current dir
    process.chdir(process.env.PWD)

    if(error) console.trace(error)
  }


  if(item.readWrite === '<')
    var stream = fs.createWriteStream(path)
    .on('open', function()
    {
      execCommands({output: this}, item.commands, onExecuted)
    })

  else
    var stream = fs.createReadStream(path)
    .on('open', function()
    {
      execCommands({input: this}, item.commands, onExecuted)
    })

  stream.on('close', fs.unlink.bind(null, path))

  callback(null, path)
}


module.exports = processSubstitution
