// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {ipcRenderer} = require('electron')
const fill_card = require('../components/card.js')

const filter_btn = document.querySelector('#filter-btn')

ipcRenderer.on('card-delivery', (e, card) => {
    fill_card(card)
})

filter_btn.addEventListener('click', () => {
    ipcRenderer.send('request-filter-win')
})

