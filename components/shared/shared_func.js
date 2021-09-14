const { ipcRenderer } = require("electron");

async function get_card(query = null, number = 1) {
    const result = await ipcRenderer.invoke('card-query', query, number)
    return result 
}
