const {ipcRenderer} = require('electron')
const close_btn = document.querySelector('#close-filter')

const noun_btn = document.querySelector('#noun-filter')
const verb_btn = document.querySelector('#verb-filter')
const adjective_btn = document.querySelector('#adjective-filter')
const adverb_btn = document.querySelector('#adverb-filter')
const yoji_btn = document.querySelector('#yoji-filter')

let filter = ""

;(() => {
    console.log("Request filter")
    ipcRenderer.send('filter-request')
})()

ipcRenderer.on('filter', (err, req_filter) => {
    console.log("Received filter: ", req_filter)
    filter = req_filter
    filter_setup()
})

function filter_setup() {
    console.log("Setup: ", filter)
    noun_btn.classList.remove('active')
    verb_btn.classList.remove('active')
    adjective_btn.classList.remove('active')
    adverb_btn.classList.remove('active')
    yoji_btn.classList.remove('active')
    switch (filter) {
        case 'noun': 
            noun_btn.classList.toggle('active')
            break
        case 'verb':
            verb_btn.classList.toggle('active')
            break
        case 'adjective':
            adjective_btn.classList.toggle('active')
            break
        case 'adverb':
            adverb_btn.classList.toggle('active')
            break
        case 'yoji':
            yoji_btn.classList.toggle('active')
            break
    }
}

noun_btn.addEventListener('click', () => {
    console.log("Click: ", filter)
    ipcRenderer.send('update-filters', 'noun')
    if(filter !== "noun") {
        filter = 'noun'
        
    } else {
        filter = ""
    }
    filter_setup()
    console.log("End: ", filter)
})

verb_btn.addEventListener('click', () => {
    console.log("Click: ", filter)
    ipcRenderer.send('update-filters', 'verb')
    if(filter !== "verb"){
        filter = 'verb'
    } else {
        filter = ""
    }
    filter_setup()
    console.log("End: ", filter)
})

adjective_btn.addEventListener('click', () => {
    console.log("Click: ", filter)
    ipcRenderer.send('update-filters', 'adjective')
    if (filter !== "adjective") {
        filter = 'adjective'
    } else {
        filter = ""
    }
    filter_setup()
    console.log("End: ", filter)
})

adverb_btn.addEventListener('click', () => {
    console.log("Click: ", filter)
    ipcRenderer.send('update-filters', 'adverb')
    if (filter !== "adverb") {
        filter = 'adverb'
    } else {
        filter = ""
    }
    filter_setup()
    console.log("End: ", filter)
})

yoji_btn.addEventListener('click', () => {
    console.log("Click: ", filter)
    ipcRenderer.send('update-filters', 'yoji')
    if (filter !== "yoji") {
        filter = 'yoji'
    } else {
        filter = ""
    }
    filter_setup()
    console.log("End: ", filter)
})

close_btn.addEventListener('click', () => {
    ipcRenderer.send('close-filter')
})
