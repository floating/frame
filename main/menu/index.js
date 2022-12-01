const { Menu } = require('electron')

// const application = {
//   label: 'Application',
//   submenu: [
//     {
//       label: 'About Application',
//       role: 'about'
//     },
//     {
//       type: 'separator'
//     },
//     {
//       label: 'Quit',
//       accelerator: 'Command+Q',
//       click: () => {
//         app.quit()
//       }
//     }
//   ]
// }

const edit = {
  label: 'Edit',
  submenu: [
    {
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo',
    },
    {
      label: 'Redo',
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo',
    },
    {
      type: 'separator',
    },
    {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut',
    },
    {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy',
    },
    {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste',
    },
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectAll',
    },
  ],
}

module.exports = () => Menu.setApplicationMenu(Menu.buildFromTemplate([edit]))
