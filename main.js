const {app, BrowserWindow, ipcMain, screen} = require('electron');
const DataStore = require('nedb');
const windowStatekeeper = require('electron-window-state')

// Dictionary database of all words
let dictionary;
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

    mainWindow.loadFile('renderer/index.html');

    // Load dictionary
    dictionary = new DataStore({filename: `${app.getPath('userData')}/dictionary`, autoload: true});
    console.log(`${app.getPath('userData')}/dictionary`)
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
        dictionary.count({}, function (err, count) {
            if (!err && count > 0) {
                // count is the number of docs
          
                // skip a random number between 0 to count-1
                var skipCount = Math.floor(Math.random() * count);

                console.log(`${app.getPath('userData')}/dictionary`)
               
                dictionary.find({kanji: '縛る'}, function (err2, docs) {
                    if (!err2) {
                        mainWindow.webContents.send('card-delivery', docs[0])
                    }
                });
            }
          });
    })

    mainWindow.on('closed', () => {
        mainWindow = null;
    })
}

ipcMain.on('new-card', (e, card) => {
    dictionary.insert(card, (err, doc) => {
        console.log("Inserted: ", doc.kanji)
        if(err) {
            console.log(err)
        }
    })

    temp_card = {
        word: card.kanji,
        _id: card._id
    }

    if (card.classification.includes('名')) {
        noun_dic.insert(temp_card, (err, doc) => {
            console.log("Inserted: ", doc.word, "into nouns.")
            if(err) {
                console.log(err)
            }
        })
    }

    if (card.classification.includes('五') || card.classification.includes('一')) {
        verb_dic.insert(temp_card, (err, doc) => {
            console.log("Inserted: ", doc.word, "into verbs.")
            if(err) {
                console.log(err)
            }
        })
    }

    if (card.classification.includes('形')) {
        adjective_dic.insert(temp_card, (err, doc) => {
            console.log("Inserted: ", doc.word, "into adjectives.")
            if(err) {
                console.log(err)
            }
        })
    }

    if (card.classification.includes('副')) {
        adverb_dic.insert(temp_card, (err, doc) => {
            console.log("Inserted: ", doc.word, "into adverbs.")
            if(err) {
                console.log(err)
            }
        })
    }

    if (card.classification.includes('四字熟語')) {
        yoji_dic.insert(temp_card, (err, doc) => {
            console.log("Inserted: ", doc.word, "into yojis.")
            if(err) {
                console.log(err)
            }
        })
    }
}) 

ipcMain.on('card-request', (err, card) => {
    dictionary.count({}, function (err, count) {
        if (!err && count > 0) {
            // count is the number of docs
            if(filter !== "") {
                switch (filter) {
                    case "noun":
                        noun_dic.count({}, (err, count_n) => {
                            var skipCount = Math.floor(Math.random() * count_n);
                            // Pick random card in nouns
                            noun_dic.find().skip(skipCount).limit(1).exec((err, filtered_cards) => {
                                // Find that same card in dictionary, since nouns only contains the word and id
                                dictionary.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
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
                                dictionary.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
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
                                dictionary.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
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
                                dictionary.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
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
                                dictionary.findOne({ kanji: filtered_cards[0].word}, (err, card) => {
                                    mainWindow.webContents.send('card-delivery', card)
                                })
                            })
                        })
                        break
                }
            }
            else {
                var skipCount = Math.floor(Math.random() * count);
                dictionary.find({}).skip(skipCount).limit(1).exec(function (err2, docs) {
                    if (!err2) {
                        mainWindow.webContents.send('card-delivery', docs[0])
                    }
                });
            }
        }
    });
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

    alertWindow.on('did-finish-load', () => {
        alertWindow.webContents.send('alert', message)
    })

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

ipcMain.on('close-filter', () => {
    filterWindow.close();
})

ipcMain.on('close-alert', () => {
    alertWindow.close();
})

ipcMain.on('update-filters', (err, new_filter) => {
    console.log("Current filter: ", filter)
    switch (new_filter) {
        case 'noun':
            if(filter !== "noun"){
                filter = 'noun'
            } else {
                filter = ""
            }
            break;
        case 'verb':
            if(filter !== "verb"){
                filter = 'verb'
            } else {
                filter = ""
            }
            break
        case 'adjective':
            if(filter !== "adjective"){
                filter = 'adjective'
            } else {
                filter = ""
            }
            break;
        case 'adverb':
            if(filter !== "adverb"){
                filter = 'adverb'
            } else {
                filter = ""
            }
            break;
        case 'yoji':
            if(filter !== "yoji"){
                filter = 'yoji'
            } else {
                filter =""
            }
            break;
    }
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