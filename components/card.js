const {ipcRenderer} = require('electron')

const card_front = document.querySelector('#card-front');
const card_back = document.querySelector('#card-back');
// Card Elements
const flip_btn = document.querySelector('#flip-btn');
const front_kanji = document.querySelector('#kanji');
const kanji_input = document.querySelector('#word');
const class_input = document.querySelector('#classification');
const hiragana_input = document.querySelector('#hiragana');
// To be attached in replacement for hiragana if there is pitch info
// It is not an input form, it's a div with four spans for visual info
const pitch_div = document.createElement("DIV");
// Used when editing or adding cards
const pitch_input = document.createElement('INPUT')
/////////////////////////////////////////////////////////////////
const definition_text = document.querySelector('#definition');
// Language switches
const en_switch = document.querySelector('#EN-switch');
const jp_switch = document.querySelector('#JP-switch');
// Card back buttons
const add_btn = document.querySelector('#add-btn')
const edit_btn = document.querySelector('#edit-btn')
const next_btn = document.querySelector('#next-btn')
// Still card back buttons but they are dettached by default
const confirm_btn = document.createElement('BUTTON')
const cancel_btn = document.createElement('BUTTON')
// Temporary definitions updated every time language switch
// is used while editing or creating a new card
let temp_jp_def = ""
let temp_en_def = ""

let temp_card

// HTML setup
;(function disable_def_behavior() {
    document.querySelectorAll('button').forEach(function (button) { return button.addEventListener('click', function (e) { return e.preventDefault(); }); });
}) ();
// Setup for buttons that are appended later on and do not exist in the html file
;(function button_styling_setup() {
    pitch_div.id = "pitch_div";

    confirm_btn.id = "confirm-btn"
    cancel_btn.id = "cancel-btn"

    confirm_btn.classList.toggle('card-btn')
    cancel_btn.classList.toggle('card-btn')

    confirm_btn.innerText = "Confirm"
    cancel_btn.innerText = "Cancel"

    pitch_input.id = "pitch_in"
    pitch_input.type = "text"
    pitch_input.placeholder = "Pitch"
    pitch_input.style.textAlign = 'center'
    pitch_input.style.fontFamily = 'Kosugi, sans-serif'
    pitch_input.style.fontSize = '2rem'
}) ();

/////////////// Card Setup ////////////////////

function flip_card() {
    card_front.classList.toggle('active');
    card_back.classList.toggle('active');
}

function get_card() {
    flip_card()
    reset_card()
    ipcRenderer.send('card-request')
}

// Setup before adding card
// Info retrieval is done in get_card_info
function add_card() {
    clear_card()
    setup_add_buttons()
    remove_card_readonly()
    // Need to add in hiragana input before adding pitch_in
    pitch_div.remove()
    class_input.insertAdjacentElement('afterend', hiragana_input)
    add_pitch_input() 
}

function edit_card() {
    setup_add_buttons()
    remove_card_readonly()
    temp_en_def = temp_card.en
    pitch_div.remove()
    class_input.insertAdjacentElement('afterend', hiragana_input)
    add_pitch_input()
    pitch_input.value = temp_card.pitch
}

function fill_card(card) {
    temp_card = card
    front_kanji.innerText = card.kanji;
    kanji_input.value = card.kanji;
    class_input.value = card.classification;
    hiragana_input.value = card.hiragana;

    // Reset the pitch_div every time you fill a card
    // pitch_div = document.createElement("DIV");

    if (card.pitch !== []) {
        // Returns a span for each character in hiragana with borders according to
        // pitch specifications
        while (pitch_div.firstChild) {
            pitch_div.removeChild(pitch_div.lastChild);
          }
        get_pitch_spans(card.pitch, card.hiragana).forEach((pitch_span) => {
            pitch_div.append(pitch_span);
        });
        hiragana_input.remove();
        console.log(pitch_div)
        class_input.insertAdjacentElement('afterend', pitch_div);
    }
    fill_definition()

    resize_front_font(card.kanji)
}

function get_card_data() {
    // Temporary definitions are updated whenever the language is switched
    // Very high probability of no lan change after final update, so update
    if (jp_switch.classList.contains("active")) {
        temp_jp_def = definition_text.value
    }
    else {
        temp_en_def = definition_text.value
    }

    if(validate_card_data()) {
        temp_kanji = kanji_input.value
        temp_classification = class_input.value
        temp_hiragana = hiragana_input.value
        temp_str = pitch_input.value
        temp_str = temp_str.replace(/\s/g, '')
        // Do l = low, h = high, r = rise, f = fall
        temp_pitch = decode_pitch(temp_str.split(','))

        temp_jp = temp_jp_def.split("|")
        temp_en = temp_en_def.split("|")

        temp_jp_def = ""
        temp_en_def = ""

        clear_card()

        temp_card = {
            kanji: temp_kanji,
            classification: temp_classification,
            hiragana: temp_hiragana,
            pitch: temp_pitch,
            jp: temp_jp,
            en: temp_en
        } 

        ipcRenderer.send('new-card', temp_card) 
    }
}

function setup_add_buttons() {
    edit_btn.remove()
    next_btn.remove()
    add_btn.remove()

    document.querySelector('#back-btns').append(cancel_btn)
    document.querySelector('#back-btns').append(confirm_btn)    
}

function remove_card_readonly () {
    kanji_input.removeAttribute('readonly')
    class_input.removeAttribute('readonly')
    hiragana_input.removeAttribute('readonly')
    definition_text.removeAttribute('readonly')
}

function add_pitch_input() {
    hiragana_input.insertAdjacentElement('afterend', pitch_input)
}

function clear_card() {
    front_kanji.innerText = ""
    kanji_input.value = ""
    class_input.value = ""
    hiragana_input.value = ""
    definition_text.value = ""
    document.querySelectorAll('.pitch_span').forEach(pitch_span => {
        pitch_span.remove()
    })
    pitch_input.value = ""
    switch_to_JP()
}

function reset_card() {
    clear_card()
    // Remove editing buttons
    pitch_input.remove()
    confirm_btn.remove()
    cancel_btn.remove()

    // Make all inpus readonly
    kanji_input.setAttribute('readonly', 'true')
    class_input.setAttribute('readonly', 'true')
    hiragana_input.setAttribute('readonly', 'true')
    definition_text.setAttribute('readonly', 'true')

    // Reset temp definitions
    temp_jp_def = ""
    temp_en_def = ""


    document.querySelector('#back-btns').append(edit_btn, next_btn, add_btn)
}

function validate_card_data() {
        // CJK (Kanji)
    if( kanji_input.value.match(/[\u4e00-\u9faf]/) == null
        // Hiragana 
        && kanji_input.value.match(/[\u3040-\u309f]/) == null
        // Katakana 
        && kanji_input.value.match(/[\u30a0-\u30ff]/) == null) {
        console.log("Error at kanji")
        request_win_alert("Word input must only include Kanji, hiragana, or katakana.")
        return false
    } 
    if (class_input.value.match(/[\u4e00-\u9faf]/) == null && class_input.value.match(/[\u3040-\u309f]/) == null) {
        request_win_alert("Classification must only contain kanji or hiragana")
        return false
    }
    // If there is no hiragana, or the entry contains kanji return false
    if (hiragana_input.value.match(/[\u3040-\u309f]/) == null || hiragana_input.value.match(/[\u4e00-\u9faf]/) !== null) {
        request_win_alert("The pronunciation should only contain hiragana")
        return false
    }
    {
        temp_str = pitch_input.value
        // Remove all spaces
        temp_str = temp_str.replace(/\s/g, '')
        // Remove all Japanese commas
        temp_str = temp_str.replace(/、/g, ",")
        // Turn the string into an array
        temp_arr = temp_str.split(',')

        if (temp_arr.length !== hiragana_input.value.length) {
            console.log("Array length: ", temp_arr.length)
            console.log("Hiragana length: ", hiragana_input.value.length)
            request_win_alert("Hiragana and pitch do not have the same number of elements")
            return false
        }
        // Function to test each element of the pitch array
        let test_str = (element) => {
            if (element == "l"  || element == "h"    || element == "r"    || element == "f"
            || element == "low" || element == "high" || element == "rise" || element == "fall") {
                return true
            } else {
                return false
            }
        }
        if(!temp_arr.every(element => test_str(element))) {
            request_win_alert("Pitch contains invalid values")
            return false
        }
    }

    // More friendly to tell which definition is missing, most likely to be the EN definition
    if (temp_en_def == "")  {
        request_win_alert("English definition is empty")
        return false
    }

    if (temp_jp_def == "") {
        request_win_alert("Japanese definition is empty")
        return false
    }
    // Make sure the jp definition contains kanji or hiragana
    // Cannot test to make sure it contains no English, some definitions
    // use English to denote abbreviations and such
    if( temp_jp_def.match(/[\u4e00-\u9faf]/) == null && temp_jp_def.match(/[\u3040-\u309f]/) == null) {
        request_win_alert("JP def has no kanji or hiragana")
        return false
    } 
    // Make sure en def contains no kanji or hiragana
    if( temp_en_def.match(/[\u4e00-\u9faf]/) !== null 
    || temp_en_def.match(/[\u3040-\u309f]/) !== null
    || temp_en_def.match(/[\u30a0-\u30ff]/) !== null) {
        request_win_alert("EN definition contains Kanji, Hiragana, or Katakana")
        return false
    } 
    return true
}

//////// Card Info Setup /////////////////////////////////////
function get_pitch_spans(pitch, hiragana) {
    if (pitch.length !== 0) {
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
}

function fill_definition(definitions) {
    if (jp_switch.classList.contains('active')) {
        temp_card.jp.forEach(function (definition) {
            var string_in = definition + "\n\n";
            definition_text.value += string_in;
        });
    }
    else {
        temp_card.en.forEach(function (definition) {
            var string_in = definition + "\n\n";
            definition_text.value += string_in;
        });
    }
}

function resize_front_font(str) {
    switch(str.length) {
        case 1:
            front_kanji.style.fontSize = '8rem'
            break
        case 2:
            front_kanji.style.fontSize = '8rem'
            break
        case 3:
            console.log("Should change to 4 rem")
            front_kanji.style.fontSize = '4rem'
            break
        case 4:
            console.log("Should change to 4 rem")
            front_kanji.style.fontSize = '4rem'
            break
        case 5:
            console.log("Should change to 4 rem")
            front_kanji.style.fontSize = '4rem'
            break;
        default:
            console.log("Should change to 2 rem")
            front_kanji.style.fontSize = '2rem'
            break;
    }  
}

function decode_pitch(str_arr) {
    temp_arr = []
    str_arr.forEach(str => {
        switch (str){
            case 'l':
                temp_arr.push('low')
                break
            case 'h':
                temp_arr.push('high')
                break
            case 'r':
                temp_arr.push('rise')
                break
            case 'f':
                temp_arr.push('fall')
                break
            default:
                temp_arr.push(str)
                break
        }
    })
    console.log(temp_arr)
    return temp_arr
}

// Language switch functions
function switch_lan() {
    en_switch.classList.toggle('active');
    jp_switch.classList.toggle('active');
}

function switch_to_JP() {
    if(en_switch.classList.contains('active')) {
        switch_lan();
        if(definition_text.hasAttribute('readonly')) {
            definition_text.value = ""
            temp_card.jp.forEach(function (definition) {
                var string_in = definition + "\n\n";
                definition_text.value += string_in;
            });
        } 
        else {
            update_definition()
            definition_text.value = temp_jp_def
        }
    }
}

function switch_to_EN() {
    if(jp_switch.classList.contains('active')) {
        switch_lan();
        if(definition_text.hasAttribute('readonly')) {
            definition_text.value = ""
            temp_card.en.forEach(function (definition) {
                var string_in = definition + "\n\n";
                definition_text.value += string_in;
            });
        }
        else {
            update_definition()
            definition_text.value = temp_en_def
            
        }
    }
}

function update_definition() {
    if(jp_switch.classList.contains('active')) {
        temp_en_def = definition_text.value
        console.log("New temp en: ", temp_en_def)
    }
    else {
        temp_jp_def = definition_text.value
        console.log("New temp jp: ", temp_jp_def)
    }
}

// Request alert window
function request_win_alert(message) {
    console.log("requested alert")
    ipcRenderer.send('alert-win', message)
}

flip_btn.addEventListener('click', flip_card)
edit_btn.addEventListener('click', edit_card)
next_btn.addEventListener('click', get_card)
add_btn.addEventListener('click', add_card)
confirm_btn.addEventListener('click', get_card_data)
cancel_btn.addEventListener('click', reset_card)
jp_switch.addEventListener('click', switch_to_JP)
en_switch.addEventListener('click', switch_to_EN)

module.exports = fill_card