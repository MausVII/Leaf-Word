const { ipcRenderer } = require('electron')

let card

const close_btn = document.querySelector('#close-btn')
const kanji_in = document.querySelector('#word')
const class_in = document.querySelector('#classification')
const pitch_div = document.querySelector('#pitch-div')
const definition_area = document.querySelector('#definition')
const jp_switch = document.querySelector('#JP-switch')
const en_switch = document.querySelector('#EN-switch')

;(() => {
    document.querySelectorAll('button').forEach(function (button) { return button.addEventListener('click', function (e) { return e.preventDefault(); }); });
}) ();

// async function get_card(query = null, number = 1) {
//     const result = await ipcRenderer.invoke('card-query', query, number)
//     return result 
// }

function get_pitch_spans({pitch, hiragana}) {
    var temp_container = [];


    for (var i = 0; i < pitch.length; i++) {
        var new_kana = document.createElement("SPAN");
        new_kana.innerText = hiragana[i];
        new_kana.classList.toggle('pitch_span');
        switch (pitch[i]) {
            case "low":
                new_kana.style.borderBottom = "2px solid var(--highlight)";
                break;
            case "high":
                new_kana.style.borderTop = "2px solid var(--highlight)";
                break;
            case "rise":
                new_kana.style.borderBottom = "2px solid var(--highlight)";
                new_kana.style.borderRight = "2px solid var(--highlight)";
                break;
            case "fall":
                new_kana.style.borderTop = "2px solid var(--highlight)";
                new_kana.style.borderRight = "2px solid var(--highlight)";
                break;
        }
        temp_container[i] = new_kana;
    }
    return temp_container;
}

function fill_definition({en, jp}) {
    if (jp_switch.classList.contains('active')) {
        let definition = jp.reduce((accumulator, current) => {
            return accumulator + "\n\n" + current
        })
        definition_area.value = definition
    } else {
        let definition = en.reduce((accumulator, current) => {
            return accumulator + "\n\n" + current
        })
        definition_area.value = definition
    }
}

function switch_language() {
    jp_switch.classList.toggle('active')
    en_switch.classList.toggle('active')
    fill_definition(card)
}

ipcRenderer.on('quick-card-delivery', (event, response) => {
    card = response
    kanji_in.value = card.kanji
    class_in.value = card.classification
    get_pitch_spans(card).forEach( (pitch_span) => {
        pitch_div.append(pitch_span)
    })
    fill_definition(card)
})

close_btn.addEventListener('click', () => {
    ipcRenderer.send('close-quickwin')
})

jp_switch.addEventListener('click', () => {
    switch_language()
})

en_switch.addEventListener('click', () => {
    switch_language()
})