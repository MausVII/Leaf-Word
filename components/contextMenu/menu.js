const {ipcRenderer} = require('electron')
const close_btn = document.querySelector('#close')

let target_kanji = ''

const flashcard_btn = document.querySelector('#show-flashcard')
const search_btn = document.querySelector('#search-related')

ipcRenderer.on('context-target', (event, kanji) => {
    target_kanji = kanji
})

flashcard_btn.addEventListener('click', () => {
    ipcRenderer.send('contextCard', target_kanji)
})

search_btn.addEventListener('click', () => {
    ipcRenderer.send('searchRelated', target_kanji)
})


close_btn.addEventListener('click', close)
document.addEventListener('contextmenu', close)

function close() {
    ipcRenderer.send('close-context')
}
