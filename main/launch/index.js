const AutoLaunch = require('auto-launch')
const launch = new AutoLaunch({ name: 'Frame' })
module.exports = {
  enable: launch.enable,
  disable: launch.disable,
  status: (cb) =>
    launch
      .isEnabled()
      .then((enabled) => cb(null, enabled))
      .catch(cb),
}
