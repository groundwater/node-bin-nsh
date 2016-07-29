const coreutils = require('coreutils.js')

const environment = require('./ast2js/_environment')


function cd(argv)
{
  // `cd` is a special case, since it needs to change the shell environment
  return coreutils.cd(argv, environment)
}


exports.cd = cd
