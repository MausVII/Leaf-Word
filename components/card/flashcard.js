const { ipcRenderer, ipcMain } = require("electron")

class Flashcard {
    constructor(card) {
        Object.assign(this, card)
    }

    update(card, notes = null, prio = null) {
        if(notes && this.notes != notes) {
            ipcRenderer.send('update-notes', notes)
        } else if(prio && this.prio != prio) {
            ipcRenderer.send('update-prio', prio)
        } else if(this != card) {
            ipcRenderer.send('new-card, card')
        }
    }

    getData() {
        return this
    }
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


module.exports = {Flashcard}