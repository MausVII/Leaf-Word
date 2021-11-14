const {ipcRenderer} = require('electron');

const deck_btn = document.querySelector('#deck-btn')
const table = document.querySelector('#browse-table')
const page_input = document.querySelector('#page-size')
const search_bar = document.querySelector('#search-bar')
const search_btn = document.querySelector('#search-btn')
const pageSlider = document.querySelector('#page-slider')
const first_slider = document.querySelector('#first-slider')
const last_slider = document.querySelector('#last-slider')
const total_count_input = document.querySelector("#total-count")
const messageBox = document.querySelector('#message-text')

var page_size = 50
var current_page = 1
const max_pages = 10
var kanji_count

;(() => {
    ipcRenderer.invoke('table-request')
    page_input.value = page_size

    for (let j = 1; j <= ( kanji_count / page_size ) || j <= max_pages; j++) {
        var slider_span = document.createElement("span")
        slider_span.id = "page-slider-" + j
        slider_span.innerHTML = j

        slider_span.addEventListener('click', (event) => {
            current_page = parseInt(event.target.innerHTML)
            console.log(current_page)
            ipcRenderer.invoke('table-request')
        })

        last_slider.before(slider_span)
    }

    kanji_count = getKanjiCount()
})()

ipcRenderer.on('table-delivery', (err, cards) => {
    messageBox.parentElement.style.display = 'initial'
    table.style.display = 'flex'
    pageSlider.style.display = 'flex'
    if(cards.length >= 1) {
        messageBox.innerText = `Found ${cards.length} results`
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

    while (table.hasChildNodes()) {
        table.firstChild.remove()
    }

    for (let i = 0; i <= page_size && i < cards.length; i++) {
        var kanji_div = document.createElement("div")
        kanji_div.classList.toggle("kanji-cell")
        
        kanji_div.id = cards[i + ((current_page - 1) * page_size)].kanji

        var kanji_span = document.createElement("abbr")
        // var hiragana_span = document.createElement("span")

        kanji_span.innerHTML = cards[i + ((current_page - 1) * page_size)].kanji
        kanji_span.title = cards[i + ((current_page - 1) * page_size)].hiragana
        // hiragana_span.innerHTML = card.hiragana

        kanji_span.classList.toggle("kanji-span")
        // hiragana_span.classList.toggle("hiragana-span")

        kanji_div.append(kanji_span)
        // kanji_div.append(hiragana_span)

        kanji_div.addEventListener('click', (event) => {
            ipcRenderer.send('quick-card', event.target.innerHTML)
        })

        kanji_div.addEventListener('contextmenu', (event) => {
            console.log(event.target.innerHTML)
            ipcRenderer.send('open-menu', event.target.innerHTML)
        })

        table.append(kanji_div)
    }  
})

async function getKanjiCount() {
    const result = await ipcRenderer.invoke('count-kanji')
    console.log(result)
    return result
}

ipcRenderer.on('kanji-count', (event, count) => {
    kanji_count = count
    total_count_input.value = count
})

deck_btn.addEventListener('click', () => {
    ipcRenderer.send('open-flashcard')
})

search_btn.addEventListener('click', (event) => {
    event.preventDefault()
    ipcRenderer.invoke('table-request', search_bar.value)
})