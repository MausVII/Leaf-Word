function handleNewCard(card, dictionary) {
    dictionary.findOne({kanji: card.kanji}, (error, result) => {
        if (result) {
            // Card already exists
            dictionary.update({kanji: card.kanji}, card, {}, (error, numReplaced) => {
                if(!error) {
                    console.log(`Updated ${numReplaced} card.`)
                    mainWindow.webContents.send('card-delivery', card)
                }
            })
        } else {
            // New card
            dictionary.insert(card, (error, doc) => {
                if(!error) {
                    console.log('Inserted new card: ', doc)
                    mainWindow.webContents.send('card-delivery', doc)
                } else {
                    console.log(error)
                }
            })
        }
    })
}