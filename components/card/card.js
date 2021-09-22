const { ipcRenderer } = require("electron")

/**
 * Toggles the active class on the front and back div
 * @param {Front div of the card} front 
 * @param {Back div of the card} back 
 */
function flip_card({front, back}) {
    front.classList.toggle('active')
    back.classList.toggle('active')
}

/**
 * ipcRendered invokes on 'card-query' and waits for a response containing
 * a new random card or a card matching the query
 * @param {What word to search, omit to get a random card} query 
 * @param {Number of cards matching the query, omit to only get one} number 
 * @returns 
 */
async function invoke_card(query = null, number = 0) {
    const result = await ipcRenderer.invoke('card-query', query, number)
    console.log(result)
    return result
}

// card_container = {
//     front: h1,
//     kanji: input,
//     tags: input,
//     hiragana: input,
//     pitch: div,
//     priority_meter: [buttons],
//     notes: button,
//     lan_switch: button,
//     text_area: text_area,
//     btn_area: div,
//     edit_btn: button,
//     next_btn: button,
//     add_btn: button
// }

function switch_to_edit_mode(card_container) {
    clear_card(card_container)
    remove_readonly(card_container)
    card_container.pitch.remove()
    card_container.tags.after(card_container_hiragana)
    card_container_hiragana.after(card_container.pitch_input)
    if(isEditing()) {
        // Fill all data
    }
}

function attach_edit_btns({btn_area, edit_btn, next_btn, add_btn, cancel_btn, confirm_btn}) {
    edit_btn.remove()
    next_btn.remove()
    add_btn.remove()
    btn_area.append(cancel_btn)
    btn_area.append(confirm_btn)
}

module.exports = {invoke_card, flip_card, switch_to_edit_mode, attach_edit_btns}