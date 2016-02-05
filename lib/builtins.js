var Readable = require('stream').Readable


function noop(){}


function cd(argv)
{
  var env = process.env  // Special case, needs to change shell global environment

  var result = new Readable({objectMode: true})
      result._read = noop

  var dir = argv[0] || env.HOME

  var showNewPwd = false
  if(dir === '-')
  {
    dir = env.OLDPWD

    if(!dir) return result.emit('error', 'cd: OLDPWD not defined')

    showNewPwd = true
  }

//  dir.replace(/^~\//, env.HOME+'/')
//  dir = path.resolve(env.PWD, dir)

  process.chdir(dir)

  env.OLDPWD = env.PWD
  env.PWD = dir

  if(showNewPwd)
  {
    dir.type = 'cd'
    result.push(dir+'\n')
  }

  result.push(null)

  return result
}


exports.cd = cd
