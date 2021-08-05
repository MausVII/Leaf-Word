const {ipcRenderer} = require('electron')

ipcRenderer.on('alert', (err, message) => {
    document.querySelector('p').innerText = message
})

document.querySelector('button').addEventListener('click', () => {
    ipcRenderer.send('close-alert')
})