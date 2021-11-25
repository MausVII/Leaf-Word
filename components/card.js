const {ipcRenderer} = require('electron')
// const Card = require('./card/flashcard')
const { Flashcard } = require('../components/card/flashcard')
const {ContainerCard } = require('../components/card/cardContainer')

const browse_btn = document.querySelector('#browse-btn')
const deck_btn = document.querySelector('#deck-btn')
const filter_btn = document.querySelector('#filter-btn')
const help_btn = document.querySelector('#help-btn')

containerCard = new ContainerCard(
    document.querySelector('#card-front'),
    document.querySelector('#card-back'),
    document.querySelector('#kanji'),
    document.querySelector('#word'),
    document.querySelector('#classification'),
    document.querySelector('#hiragana'),
    document.createElement('INPUT'),
    document.createElement('DIV'),
    document.querySelector('#priority-meter'),
    document.querySelector('#notes-btn'),
    document.querySelector('#JP-switch'),
    document.querySelector('#EN-switch'),
    document.querySelector('#definition'),
    document.querySelector('#back-btns'),
    document.querySelector('#edit-btn'),
    document.querySelector('#next-btn'),
    document.querySelector('#add-btn'),
    document.createElement('BUTTON'),
    document.createElement('BUTTON'),
    document.querySelector('#flip-btn'),
    document.querySelector('#left-arrow'),
    document.querySelector('#right-arrow')
)

let temp_jp_def = ""
let temp_en_def = ""
let notes = ''
let isEditingNotes = false
let isEditing = false
let priority
let variantsRot = []
let currRot = 0
let prioBtns = containerCard.getPrioBtns()

let temp_card

// HTML setup
;(async function disable_def_behavior() {
    // console.log("Invoked card: ", await Card.invoke_card("乗り遅れる"))
    document.querySelectorAll('button').forEach(function (button) { return button.addEventListener('click', function (e) { return e.preventDefault(); }); });
}) ();

ipcRenderer.on('card-delivery', (e, card) => {
    try_card = new Flashcard(card)
    console.log(card)
    containerCard.fillCard(card, false)

    containerCard.resizeFrontKanji()

    temp_jp_def = card.jap_def.reduce((accumulator, current) => {
        return accumulator + "\n\n" + current
    })

    temp_en_def = card.eng_def.reduce((accumulator, current) => {
        return accumulator + "\n\n" + current
    })

    priority = card.priority
    notes = card.notes
    // Pending: I don't know why I have to call both of them, fix it
    containerCard.colorPrioBtns(priority)
    containerCard.updatePrioBtns(priority)

    if(card.variants.length >= 1) {
        containerCard.appendArrows()
    } else {
        containerCard.removeArrows()
    }

    currRot = 0
    variantsRot = []
    variantsRot.push(card.kanji)
    for (const variant of card.variants) {
        variantsRot.push(variant)
    }
    temp_card = card
})

filter_btn.addEventListener('click', () => {
    ipcRenderer.send('request-filter-win')
})

help_btn.addEventListener('click', () => {
    console.log("Send request for quick card.")
    ipcRenderer.send('quick-card', '意図')
})

function confirm_edit() {
    let tempCard = {}

    processedPitch = decodePitch(containerCard.getPitch())

    // Update temp definitions one last time
    // unlikely that user switches languages before finishing
    if(isEditingNotes) {
        notes = containerCard.getTextData()
        closeNotesEditing()
    } else {
        if(containerCard.getLang() === 'jap') {
            temp_jp_def = containerCard.getTextData()
        } else {
            temp_en_def = containerCard.getTextData()
        }
    }

    let japDef = getDefinition(temp_jp_def)
    let engDef = getDefinition(temp_en_def)

    if (validateCardData(processedPitch, japDef, engDef)) {
        tempCard.kanji = containerCard.getData().kanji
        tempCard.variants = getVariants(temp_jp_def)
        tempCard.hiragana = containerCard.getData().hiragana
        tempCard.tags = containerCard.getData().tags
        tempCard.pitch = processedPitch
        tempCard.eng_def = engDef
        tempCard.jap_def = japDef
        tempCard.priority = priority
        tempCard.components = getComponents(tempCard.kanji)
        tempCard.notes = notes
        console.log(tempCard)

        ipcRenderer.send('new-card', tempCard)
        containerCard.flip()
        containerCard.reset()
        closeEditing()
    }
}

/**
 * 
 * @returns true if all validation tests are passes
 */
function validateCardData(processedPitch, japDef, engDef) {

    console.log(containerCard.getData())
    if (containerCard.getData().kanji == '' || containerCard.getData().tags == '' || containerCard.getData().hiragana == '') {

    }
        // CJK (Kanji)
    if( containerCard.getData().kanji.match(/[\u4e00-\u9faf]/) == null
        // Hiragana 
        && containerCard.getData().kanji.match(/[\u3040-\u309f]/) == null
        // Katakana 
        && containerCard.getData().kanji.match(/[\u30a0-\u30ff]/) == null) {
        requestWinAlert("Kanji input must include Kanji, hiragana, or katakana.")
        containerCard.errorHighlight("kanji")
        return false
    } 

    if (containerCard.getData().tags.match(/[\u4e00-\u9faf]/) == null && containerCard.getData().tags.match(/[\u3040-\u309f]/) == null) {
        requestWinAlert("Tags must contain kanji or hiragana")
        containerCard.errorHighlight("tags")
        return false
    }
    // If there is no hiragana, or the entry contains kanji return false
    if (containerCard.getData().hiragana.match(/[\u3040-\u309f]/) == null || containerCard.getData().hiragana.match(/[\u4e00-\u9faf]/) !== null) {
        requestWinAlert("The pronunciation should only contain hiragana")
        return false
    }

    if (processedPitch.length !== containerCard.getData().hiragana.length) {
        console.log("Pitch length: ", processedPitch.length)
        console.log("Hiragana length: ", containerCard.getData().hiragana.length)
        requestWinAlert("Hiragana and pitch do not have the same number of elements")
        containerCard.errorHighlight("hiragana")
        containerCard.errorHighlight("pitch")
        return false
    }
    
    for (const element of processedPitch) {
        if (element == "low" || element == "high" || element == "rise" || element == "fall") {
            
        } else {
            requestWinAlert("Pitch should only contain high (h), low (l), rise (r), or fall (f)")
            containerCard.errorHighlight("pitch")
            return false
        }
    }
        

    // More friendly to tell which definition is missing, most likely to be the EN definition
    if (engDef == "")  {
        if(containerCard.getLang() === 'jap') {
            containerCard.switchLan()
            containerCard.fillDefinition({eng_def: temp_en_def, jap_def: temp_jp_def})
        }
        containerCard.errorHighlight("textArea")
        requestWinAlert("English definition is empty")
        return false
    }

    if (japDef == "") {
        if(containerCard.getLang() === 'eng'){
            containerCard.switchLan()
            containerCard.fillDefinition({eng_def: temp_en_def, jap_def: temp_jp_def})
        }
        containerCard.errorHighlight("textArea")
        requestWinAlert("Japanese definition is empty")
        return false
    }
    // Make sure the jp definition contains kanji or hiragana
    // Cannot test to make sure it contains no English, some definitions
    // use English to denote abbreviations and such
    for (const def of japDef) {
        if( def.match(/[\u4e00-\u9faf]/) == null && def.match(/[\u3040-\u309f]/) == null) {
            console.log(def)
            console.log(def.match(/[\u4e00-\u9faf]/))
            containerCard.errorHighlight("textArea")
            requestWinAlert("JP def has no kanji or hiragana")
            return false
        } 
    }
    
    // Make sure en def contains no kanji or hiragana
    for (const def of engDef) {
        if( def.match(/[\u4e00-\u9faf]/) !== null 
        || def.match(/[\u3040-\u309f]/) !== null
        || def.match(/[\u30a0-\u30ff]/) !== null) {
            requestWinAlert("EN definition contains Kanji, Hiragana, or Katakana")
            return false
        } 
    }
    
    return true
}

function getVariants(text) {
    let variants = []
    if(text.match(/(?<=\$).*(?=\$)/g)) {
        let cutText = text.match(/(?<=\$).*(?=\$)/g)[0]

        cutText = cutText.replace(/\s/g, '')
        cutText = cutText.replace(/、/g, ',')
        for (const variant of cutText.split(',')) {
            if(!variants.includes(variant)) variants.push(variant)
        }
    }

    return variants
}

function getDefinition(text) {
    let unprocessedText = text
    let processedText = []
    if(text.match(/(?<=\$).*(?=\$)/g)) {
        // Remove the variants string
        unprocessedText = unprocessedText.replace(/.(?<=\$).*(?=\$)./g, '')
        
        // Single new line after variants string
        unprocessedText = unprocessedText.replace(/^\n/, '')
    }
    // Lines starting with spaces
    unprocessedText = unprocessedText.replace(/^\s/gm, '')
    // Removes double new lines
    unprocessedText = unprocessedText.replace("\n\n", '\n')
    // Removes new lines and returns
    unprocessedText = unprocessedText.replace(/[\r\n]+/g, '|')
    for (const definition of unprocessedText.split('|')) {
        processedText.push(definition)
    }

    return processedText
}

/**
 * Decodes the pitch: turns l -> low, h -> high, f -> fall, r -> rise
 * @param {*} str_arr Arrays containing the strings for each pitch value
 * @returns Array with the finished pitched values
 */
function decodePitch(str_arr) {
    decodedPitch = []
    str_arr = str_arr.replace(/\s/g, '')
    str_arr = str_arr.replace(/、/g, ',')
    temp_arr = str_arr.split(',')
    temp_arr.forEach(str => {
        switch (str){
            case 'l':
                decodedPitch.push('low')
                break
            case 'h':
                decodedPitch.push('high')
                break
            case 'r':
                decodedPitch.push('rise')
                break
            case 'f':
                decodedPitch.push('fall')
                break
            default:
                decodedPitch.push(str)
                break
        }
    })
    return decodedPitch
}

// Language switch functions
function switchLan() {
    if (isEditingNotes) {
        notes = containerCard.getTextData()
        closeNotesEditing()
        console.log("Just updated notes to ", notes)
    } else {
        update_definition()
    }

    // Chances are the textarea was set to readonly during closeNotesEditing()
    if(isEditing) {
        containerCard.removeTextAreaReadonly()
    }

    containerCard.switchLan()
    
    // In editing process
    if(!isEditingNotes && isEditing) {
        //console.log("Using temp definitions while editing")
        containerCard.fillDefinition({eng_def: temp_en_def, jap_def: temp_jp_def})
    }  else { // Not in editing process. Regular language switch
        //console.log("Regular language switch")
        containerCard.fillDefinition(temp_card)
    }
}

/**
 * Does the setup to receive a new card: reset_card(), flip_Card() and send 'card-request' to ipcRenderer
 */
function reset_and_request() {
    containerCard.handleCancel()
    closeEditing()
    ipcRenderer.send('card-request');
}

function openNotesEditing() {
    containerCard.removeTextAreaReadonly()
    isEditingNotes = true
}

function closeNotesEditing () {
    containerCard.makeTextAreaReadonly()
    isEditingNotes = false
}

function update_definition() {
    if(containerCard.getLang() === 'jap') {
        temp_jp_def = containerCard.getTextData()
    } 
    else {
        temp_en_def = containerCard.getTextData()
    }
}

function getComponents(kanji) {
    kanji = kanji.replace(/\s/g, '')
    let container = []
    for (character of kanji) {
        if(character.match(/[\u4e00-\u9faf]/)) {
            if(!container.includes(character)) container.push(character)
        }
    }
    return container
}

// Request alert window
function requestWinAlert(message) {
    ipcRenderer.send('alert-win', message)
}

browse_btn.addEventListener('click', () => {
    ipcRenderer.send('load-browse')
})

deck_btn.addEventListener('click', () => {
    ipcRenderer.send('load-deck')
})

for(btn of prioBtns) {
    // Light up any prio btns above the current priority level during mouse enter
    btn.addEventListener('mouseenter', (event) => {
        // Index of prio btn (1 to 5) comes from html id (id="prio-x")
        const index = event.target.id.split('-')[1]
        for(let i = 1; i <= index; i++) {
            if(i > priority) {
                prioBtns[i - 1].classList.add('active')
            }
        }
    })

    // Turn off any prio btns above the current prio level after mouse leave
    btn.addEventListener('mouseleave', (event) => {
        const index = event.target.id.split('-')[1]
        for(let i = 1; i <= index; i++) {
            if(i > priority) {
                prioBtns[i - 1].classList.remove('active')
            }
        }
    })

    // Update prio on click and update prio btns with active class
    btn.addEventListener('click', (event) => {
        if(priority === parseInt(event.target.id.split('-')[1]) ) {
            priority = 0
        } else {
            priority = parseInt(event.target.id.split('-')[1])
        }
        containerCard.updatePrioBtns(priority)
    })
}

/**
 * Set editing to true. Remove read only from definition text
 */
function handleNotes() {
    // Pending: check for settings before allowing editing
    if(isEditingNotes) {
        notes = containerCard.getTextData()
        console.log('Just updated notes to', notes)
        containerCard.fillDefinition({eng_def: temp_en_def, jap_def: temp_jp_def})
        closeNotesEditing()
        if(containerCard.getLang() === 'jap') {
            containerCard.updatePlaceholder('Japanese Definition')
        } else {
            containerCard.updatePlaceholder('English Definition')
        }
    } else {
        openNotesEditing()
        containerCard.fillDefinition({ eng_def: [notes], jap_def: [notes] })
        containerCard.updatePlaceholder('Notes')
    }
}

function handleEdit() {
    openEditing()
    containerCard.enterEditMode()
    containerCard.fillCard(temp_card, true)
}

function handleNext() {
    // Pending: Create condition in case editing is disabled in settings
    if (temp_card.priority != priority) {
        ipcRenderer.send('update-prio', temp_card.kanji, priority)
    }
    if(temp_card.notes != notes) {
        ipcRenderer.send('update-notes', temp_card.kanji, notes)
    }

    containerCard.flip()
    containerCard.reset()
    ipcRenderer.send('card-request')
}

function handleAdd() {
    openEditing()
    temp_en_def = ""
    temp_jp_def = ""
    priority = 0
    containerCard.updatePrioBtns(priority)
    containerCard.enterEditMode()
}

function openEditing() {
    isEditing = true
}

function closeEditing() {
    isEditing = false
}

function rotateVariant(direction) {
    if(direction === 'left') {
        if (currRot === 0) {
            currRot = variantsRot.length - 1
        } else {
            currRot -= 1
        }
    } else if(direction === 'right'){
        if (currRot === variantsRot.length - 1) {
            currRot = 0
        } else {
            currRot += 1
        }
    }
    containerCard.updateKanji(variantsRot[currRot])
}

//flip_btn.addEventListener('click', handleFlip)
containerCard.getEditBtn().addEventListener('click', handleEdit)
containerCard.getNextBtn().addEventListener('click', handleNext)
containerCard.getAddBtn().addEventListener('click', handleAdd)
containerCard.getConfirmBtn().addEventListener('click', confirm_edit)
containerCard.getCancelBtn().addEventListener('click', reset_and_request)
containerCard.getNotesBtn().addEventListener('click', handleNotes)
containerCard.getJapBtn().addEventListener('click', switchLan)
containerCard.getEngBtn().addEventListener('click', switchLan)
containerCard.getLeftArrowBtn().addEventListener('click', () => { rotateVariant("left") })
containerCard.getRightArrowBtn().addEventListener('click', () => { rotateVariant('right') })

