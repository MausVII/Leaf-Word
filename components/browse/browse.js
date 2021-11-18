const {ipcRenderer} = require('electron');

const deck_btn = document.querySelector('#deck-btn')
const table = document.querySelector('#browse-table')
const page_input = document.querySelector('#page-size')
const search_bar = document.querySelector('#search-bar')
const search_btn = document.querySelector('#search-btn')
const pageSlider = document.querySelector('#page-slider')
const first_slider = document.querySelector('#first-slider')
const lastSlider = document.querySelector('#last-slider')
const total_count_input = document.querySelector("#total-count")
const messageBox = document.querySelector('#message-text')

let pageSize = 50
let previousPage = 0
let currentPage = 1
const maxPages = 10
let kanjiCount

;(() => {
    ipcRenderer.invoke('table-request')
    page_input.value = pageSize

    for (let j = 1; j <= ( kanjiCount / pageSize ) || j <= maxPages; j++) {
        let sliderSpan = document.createElement("span")
        sliderSpan.id = "page-slider-" + j
        sliderSpan.innerHTML = j

        sliderSpan.addEventListener('click', (event) => {
            previousPage = currentPage
            currentPage = parseInt(event.target.innerHTML)
            ipcRenderer.invoke('table-request')
        })

        lastSlider.before(sliderSpan)
    }

    
    kanjiCount = getKanjiCount()
})()

ipcRenderer.on('table-delivery', (err, cards) => {
    messageBox.parentElement.style.display = 'initial'
    table.style.display = 'flex'
    pageSlider.style.display = 'flex'
    
    showNumFound(cards.length)

    while (table.hasChildNodes()) {
        table.firstChild.remove()
    }

    for (let i = 0; i <= pageSize && i < cards.length; i++) {
        var kanjiDiv = document.createElement("div")
        kanjiDiv.classList.toggle("kanji-cell")
        
        kanjiDiv.id = cards[i + ((currentPage - 1) * pageSize)].kanji

        var kanji_span = document.createElement("abbr")
        // var hiragana_span = document.createElement("span")

        kanji_span.innerHTML = cards[i + ((currentPage - 1) * pageSize)].kanji
        kanji_span.title = cards[i + ((currentPage - 1) * pageSize)].hiragana
        // hiragana_span.innerHTML = card.hiragana

        kanji_span.classList.toggle("kanji-span")
        // hiragana_span.classList.toggle("hiragana-span")

        kanjiDiv.append(kanji_span)
        // kanji_div.append(hiragana_span)

        kanjiDiv.addEventListener('click', (event) => {
            ipcRenderer.send('quick-card', event.target.innerHTML)
        })

        kanjiDiv.addEventListener('contextmenu', (event) => {
            console.log(event.target.innerHTML)
            ipcRenderer.send('open-menu', event.target.innerHTML)
        })

        table.append(kanjiDiv)
    }  

    updatePageSlider()
})

async function getKanjiCount() {
    const result = await ipcRenderer.invoke('count-kanji')
    console.log(result)
    return result
}

const updatePageSlider = () => {
    if(previousPage !== 0) {
        document.querySelector(`#page-slider-${previousPage}`).classList.toggle('active')
    }
    document.querySelector(`#page-slider-${currentPage}`).classList.toggle('active')
}

const showNumFound = (length) => {
    if(length >= 1) {
        messageBox.innerText = `Found ${length} results`
        setTimeout(() => {
            messageBox.parentElement.style.display = 'none'
        }, 3000)
    } else {
        messageBox.innerText = `Found 0 results`
        table.style.display = 'none'
        pageSlider.style.display = 'none'
        setTimeout(() => {
            messageBox.parentElement.style.display = 'none'
        }, 3000)
    }
}

ipcRenderer.on('kanji-count', (event, count) => {
    kanjiCount = count
    total_count_input.value = count
})

deck_btn.addEventListener('click', () => {
    ipcRenderer.send('open-flashcard')
})

search_btn.addEventListener('click', (event) => {
    event.preventDefault()
    ipcRenderer.invoke('table-request', search_bar.value)
})