module.exports = {
  addPermission: (u, host, permission) => {
    u('permissions', host, permissions => {
      if (permissions.indexOf(permission) === -1) permissions.push(permission)
      return permissions
    })
  },
  removePermission: (u, host, permission) => {
    u('permissions', host, permissions => {
      let index = permissions.indexOf(permission)
      if (index > -1) permissions.splice(index, 1)
      return permissions
    })
  },
  setNetwork: (u, newNetwork) => {
    u('network', () => newNetwork)
  }
}
