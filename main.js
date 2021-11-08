const {app, BrowserWindow, ipcMain, screen} = require('electron');
const DataStore = require('nedb');
const windowStatekeeper = require('electron-window-state')

// Dictionary database of all words
let queueCard = '激励'
let dictionary;
let new_dic;
// String that represents the current filter
let filter = ""
// List of all verbs in dictionary, contains kanji and id
let verb_dic
// List of all nouns in dictionary, contains kanji and id
let noun_dic
// List of all adjectives in dictionary, contains kanji and id
let adjective_dic
// List of all adverbs in dictionary, contains kanji and id
let adverb_dic
// List of all yojis in dictionary, contains kanji and id
let yoji_dic

let mainWindow, filterWindow

function createWindow() {
    // Win State keeper
    let state = windowStatekeeper({
        defaultWidth: 1000,
        defaultHeight: 900
    })

    mainWindow = new BrowserWindow({
        x: state.x, y: state.y,
        width: state.width,
        height: state.height,
        minHeight: 900,
        child: filterWindow,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    })

    // components/browse/browse.html
    // ./renderer/index.html
    mainWindow.loadFile('./renderer/index.html');

    // Load dictionary
    dictionary = new DataStore({filename: `${app.getPath('userData')}/dictionary`, autoload: true});
    console.log(`${app.getPath('userData')}/dictionary`)

    new_dic = new DataStore({filename: "./data/dictionary",
                            timestampData: true,
                            autoload: true,
                            })

    dictionary.ensureIndex({fieldName: 'kanji', unique: true})
    noun_dic = new DataStore({filename: `${app.getPath('userData')}/nouns`, autoload: true});
    noun_dic.ensureIndex({fieldname: 'word', unique: true})
    verb_dic = new DataStore({filename: `${app.getPath('userData')}/verbs`, autoload: true});
    verb_dic.ensureIndex({fieldname: 'word', unique: true})
    adjective_dic = new DataStore({filename: `${app.getPath('userData')}/adjectives`, autoload: true});
    adjective_dic.ensureIndex({fieldname: 'word', unique: true})
    adverb_dic = new DataStore({filename: `${app.getPath('userData')}/adverbs`, autoload: true});
    adverb_dic.ensureIndex({fieldname: 'word', unique: true})
    yoji_dic = new DataStore({filename: `${app.getPath('userData')}/yojis`, autoload: true});
    yoji_dic.ensureIndex({fieldname: 'word', unique: true})

    
    

    // Manage new window state
    state.manage(mainWindow)
    // Remove when the time has come
    mainWindow.webContents.openDevTools();

    mainWindow.webContents.on('did-finish-load', e => {
        new_dic.count({}, function (err, count) {
            if (!err && count > 0) {
                // count is the number of docs
          
                // skip a random number between 0 to count-1
                var skipCount = Math.floor(Math.random() * count);

                console.log(`${app.getPath('userData')}/dictionary`)
                new_dic.count({}, (error, count) => {
                    if(!error) {
                        mainWindow.webContents.send('kanji-count', count)
                    } else {
                        console.log(error)
                    }
                })
                
               
                new_dic.find({kanji: queueCard}, function (error, docs) {
                    if (!error) {
                        // if(docs[0].priority == undefined) {
                        //     new_dic.update({kanji: docs[0].kanji}, { $set: {priority: 0} }, {}, (err, numReplaced) => {
                        //         console.log("Replaced", numReplaced)
                        //     })
                        // } else {
                        //     console.log("Prio already set.")
                        // }
                        mainWindow.webContents.send('card-delivery', docs[0])
                    } else {
                        alert(error)
                    }
                });

            }
          });
    })

    /// Temp stuff
    function get_full_card(card) {
        let newCard = {
            kanji: card.kanji,
            variants: [],
            hiragana: card.hiragana,
            tags: card.classification,
            pitch: [...card.pitch],
            eng_def: [...card.en],
            jap_def: [...card.jp],
            priority: 0,
            components: get_components(card),
            notes: ''
        }
        return newCard
    }

    function get_components({kanji}) {
        let container = []
        for (character of kanji) {
            if(character.match(/[\u4e00-\u9faf]/)) {
                container.push(character)
            }
        }
        return container
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    })
}

ipcMain.on('new-card', (e, card) => {
    new_dic.findOne({kanji: card.kanji}, (error, result) => {
        if (result) {
            // Card already exists
            new_dic.update({kanji: card.kanji}, card, {}, (error, numReplaced) => {
                if(!error) {
                    console.log(`Updated ${numReplaced} card.`)
                    mainWindow.webContents.send('card-delivery', card)
                }
            })
        } else {
            // New card
            new_dic.insert(card, (error, doc) => {
                if(!error) {
                    console.log('Inserted new card: ', doc)
                    mainWindow.webContents.send('card-delivery', doc)
                } else {
                    console.log(error)
                }
            })
        }
    })
}) 

ipcMain.on('quick-card', (event, query) => {
    console.log(query)
    new_dic.findOne({kanji: query}, (error, doc) => {
        if(!error) {
            console.log(doc)
            quickWin = new BrowserWindow({
                parent: mainWindow,
                width: 300,
                height: 400,
                frame: false,
                show: true,
                modal: true,
                resizable: false,
                webPreferences: {
                    contextIsolation: false,
                    nodeIntegration: true
                }
            })
        
            quickWin.loadFile('components/quick_card/quick_card.html');
        
            // quickWin.openDevTools()

            quickWin.on('ready-to-show', () => {
                console.log("Sending quick card")
                quickWin.webContents.send('quick-card-delivery', doc)
                let pos = mainWindow.getPosition()
                quickWin.setPosition(pos[0] + 200, pos[1] + 200)
                quickWin.show()
            })
        
            quickWin.on('closed', () => {
                filterWindow = null;
            })
        } 
        else {
            console.log("Error happened.")
        }
    }) 
})

ipcMain.handle('card-query', async (event, query, number) => {
    let result = await new Promise((resolve, reject) => {
        if (query) {
            new_dic.find({ $or : [{kanji: query}, {hiragana: query}] })
                .limit(number).exec((error, docs) => {
                    if(!error) {
                        resolve(docs)
                    }
                    else {
                        reject(docs)
                    }
            })
        }
    })
    return result
})

ipcMain.on('contextCard', (event, card) => {
    console.log(card)
    queueCard = card
    contextMenu.close()
    mainWindow.loadFile('./renderer/index.html')
    
})

ipcMain.on('searchRelated', async (event, target_kanji) => {
    related = []

    new_dic.findOne({kanji: target_kanji}, (error, doc) => {
        let components = doc.components

        console.log(components)
        new_dic.find( { components: { $in: components } }, (error, docs) => {
            mainWindow.webContents.send('table-delivery', docs)
            contextMenu.close()
        })
    })
    
})

ipcMain.on('card-request', (err, card) => {
    if(filter !== "") {
        switch (filter) {
            case "noun":
                noun_dic.count({}, (err, count_n) => {
                    var skipCount = Math.floor(Math.random() * count_n);
                    // Pick random card in nouns
                    noun_dic.find().skip(skipCount).limit(1).exec((err, filtered_cards) => {
                        // Find that same card in dictionary, since nouns only contains the word and id
                        new_dic.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
                            mainWindow.webContents.send('card-delivery', card)
                        })
                    })
                })
                break
            case "verb":
                verb_dic.count({}, (err, count_v) => {
                    var skipCount = Math.floor(Math.random() * count_v);
                    // Pick random card in adjectives
                    verb_dic.find().skip(skipCount).limit(1).exec((err, filtered_cards) => {
                        // Find that same card in dictionary, since adjectives only contains the word and id
                        new_dic.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
                            mainWindow.webContents.send('card-delivery', card)
                        })
                    })
                })
                break
            case "adjective":
                adjective_dic.count({}, (err, count_adj) => {
                    var skipCount = Math.floor(Math.random() * count_adj);
                    // Pick random card in adjectives
                    adjective_dic.find().skip(skipCount).limit(1).exec((err, filtered_cards) => {
                        // Find that same card in dictionary, since adjectives only contains the word and id
                        new_dic.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
                            mainWindow.webContents.send('card-delivery', card)
                        })
                    })
                })
                break
            case "adverb":
                adverb_dic.count({}, (err, count_adj) => {
                    var skipCount = Math.floor(Math.random() * count_adj);
                    // Pick random card in adjectives
                    adverb_dic.find().skip(skipCount).limit(1).exec((err, filtered_cards) => {
                        // Find that same card in dictionary, since adjectives only contains the word and id
                        new_dic.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
                            mainWindow.webContents.send('card-delivery', card)
                        })
                    })
                })
                break
            case "yoji":
                yoji_dic.count({}, (err, count_adj) => {
                    var skipCount = Math.floor(Math.random() * count_adj);
                    // Pick random card in adjectives
                    yoji_dic.find().skip(skipCount).limit(1).exec((err, filtered_cards) => {
                        // Find that same card in dictionary, since adjectives only contains the word and id
                        new_dic.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
                            mainWindow.webContents.send('card-delivery', card)
                        })
                    })
                })
                break
        }
    }
    else {
        new_dic.count({}, (error, count) => {
            var skipCount = Math.floor(Math.random() * count)
            new_dic.find({}).skip(skipCount).limit(1).exec(function (err2, docs) {
                if (!err2) {
                    mainWindow.webContents.send('card-delivery', docs[0])
                }
            })
        })
        
    }
})

ipcMain.on('update-prio', (event, kanji, priotity) => {
    new_dic.update({kanji: kanji}, {$set: {priority: priotity}}, {}, (error, numReplaced, affectedDoc) => {
        if(!error) {
            console.log("Updated priotity on: ", kanji, " to ", priotity)
        } else {
            console.log(error)
        }
    })
})

ipcMain.on('update-notes', (event, kanji, notes) => {
    new_dic.update({kanji: kanji}, {$set: {notes: notes}}, {}, (error) => {
        if(!error) {
            console.log("Updated notes on: ", kanji, " to ", notes)
        } else {
            console.log(error)
        }
    })
})

ipcMain.handle('table-request', (event, query) => {
    console.log("Query: ", query)
    results = []
    if(query) {
        // dictionary.find({ $or : [{kanji: query}, {hiragana: query}] })
        // $or: [{kanji: query}, {hiragana: query}]
        new_dic.find({ $or : [{kanji: query}, {hiragana: query}, {components: query} ] }, (err, results) => {
            console.log("Kanji", results)
            mainWindow.webContents.send('table-delivery', results)
        })
    } else {
        new_dic.find({}).sort({updatedAt: -1}).exec((err, docs) => {
            mainWindow.webContents.send('table-delivery', docs)
        })
    }
})

ipcMain.on('request-filter-win', (err) => {
    filterWindow = new BrowserWindow({
        parent: mainWindow,
        width: 500,
        height: 400,
        frame: false,
        show: false,
        modal: true,
        resizable: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    })

    filterWindow.loadFile('components/filter.html');

    // filterWindow.openDevTools()
    
    filterWindow.on('ready-to-show', () => {
        let pos = mainWindow.getPosition()
        filterWindow.setPosition(pos[0] + 100, pos[1] + 120)
        filterWindow.show()
    })

    ipcMain.on('filter-request', () => {
        console.log("Sent filter: ", filter, " to filter.js")
        filterWindow.webContents.send('filter', filter)
    })

    filterWindow.on('closed', () => {
        filterWindow = null;
    })
})

ipcMain.on('alert-win', (err, message) => {
    console.log("Received win request with: ", message)
    alertWindow = new BrowserWindow({
        parent: mainWindow,
        width: 300,
        height: 140,
        frame: false,
        show: false,
        modal: true,
        resizable: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    })

    alertWindow.loadFile('components/alert/alert.html')

    alertWindow.on('ready-to-show', () => {
        console.log("Created alert window")
        alertWindow.webContents.send('alert', message)

        let pos = screen.getCursorScreenPoint()
        alertWindow.setPosition(pos.x - 150, pos.y - 200)
        alertWindow.show()
    })

    alertWindow.on('closed', () => {
        alertWindow = null;
    })
})

ipcMain.on('open-menu', (event, kanji) => {
    contextMenu = new BrowserWindow({
        parent: mainWindow,
        width: 150,
        height: 180,
        frame: false,
        show: false,
        modal: true,
        resizable: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    })

    contextMenu.loadFile('components/contextMenu/menu.html')

    contextMenu.on('ready-to-show', () => {
        let pos = screen.getCursorScreenPoint()
        contextMenu.setPosition(pos.x, pos.y)
        contextMenu.show()

        contextMenu.webContents.send('context-target', kanji)
    })

    contextMenu.on('closed', () => {
        contextMenu = null;
    })
})

ipcMain.handle('count-kanji', async () => {
    let count = await new Promise((resolve, reject) => {
        new_dic.count({}, (error, count) => {
            if(!error) {
                resolve(count)
            } else {
                reject(count)
            }
        }) 
    })
    return count
})


ipcMain.on('close-filter', () => {
    filterWindow.close();
})

ipcMain.on('close-quickwin', () => {
    quickWin.close();
})

ipcMain.on('close-context', () => {
    contextMenu.close()
})

ipcMain.on('close-alert', () => {
    alertWindow.close();
})

ipcMain.on('update-filters', (err, new_filter) => {
    console.log("Current filter: ", filter)
    switch (new_filter) {
        case 'noun':
            if(filter !== 'noun'){
                filter = 'noun'
            } else {
                filter = ""
            }
            break;
        case 'verb':
            if(filter !== 'verb'){
                filter = 'verb'
            } else {
                filter = ""
            }
            break
        case 'adjective':
            if(filter !== 'adjective'){
                filter = 'adjective'
            } else {
                filter = ""
            }
            break;
        case 'adverb':
            if(filter !== 'adverb'){
                filter = 'adverb'
            } else {
                filter = ""
            }
            break;
        case 'yoji':
            if(filter !== 'yoji'){
                filter = 'yoji'
            } else {
                filter =""
            }
            break;
    }
})

ipcMain.on('open-flashcard', () => {
    mainWindow.loadFile('./renderer/index.html')
})

ipcMain.on('load-browse', () => {
    mainWindow.loadFile('components/browse/browse.html')
})

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit()
})

// When app icon is clicked and app is running, (macOS) recreate window
app.on('activate', () => {
    if(mainWindow === null) createWindow()
})