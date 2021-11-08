class ContainerCard {
    constructor(front, back, frontKanji, kanji, tags, hiragana, pitchInput, pitch, prioMeter, notesBtn, japBtn, engBtn, textArea, backBtns, editBtn, nextBtn, addBtn, confirmBtn, cancelBtn, flipBtn, leftArrow, rightArrow) {
        
        Object.assign(this, {front, back, frontKanji, kanji, tags, hiragana, pitchInput, pitch, prioMeter, notesBtn, japBtn, engBtn, textArea, backBtns, editBtn, nextBtn, addBtn, confirmBtn, cancelBtn, flipBtn, leftArrow, rightArrow})

        // Pitch setup
        this.pitch.id = "pitch-div"
        this.pitchInput.id = "pitch-input"
        this.pitchInput.placeholder = "Pitch"

        // Confirm and Cancel btns setup
        this.confirmBtn.id = 'confirm-btn'
        this.cancelBtn.id = 'cancel-btn'
        this.confirmBtn.classList.add('card-btn')
        this.cancelBtn.classList.add('card-btn')
        this.confirmBtn.innerText = 'Confirm'
        this.cancelBtn.innerText = 'Cancel'
        
        this.kanji.addEventListener('blur', event => this.removeErrorHighlight(event.target))
        this.tags.addEventListener('blur', event => this.removeErrorHighlight(event.target))
        this.hiragana.addEventListener('blur', event => this.removeErrorHighlight(event.target))
        this.pitchInput.addEventListener('blur', event => this.removeErrorHighlight(event.target))
        this.textArea.addEventListener('blur', event => this.removeErrorHighlight(event.target))

        this.flipBtn.addEventListener('click', this.flip)
    }

    flip = () => {
        this.front.classList.toggle('active')
        this.back.classList.toggle('active')
    }

    handleCancel = () => {
        this.reset()
        this.flip()
    }

    clear = () => {
        this.frontKanji.innerText = ""
        this.kanji.value = ""
        this.tags.value = ""
        this.hiragana.value = ""
        this.textArea.value = ""
        this.pitchInput.value = ""

        if(this.japBtn.classList.contains('active')) {
            this.updatePlaceholder("Japanese Definition")
        } else {
            this.updatePlaceholder("English Definition")
        }

        while(this.pitch.hasChildNodes()) {
            this.pitch.removeChild(this.pitch.firstChild)
        }

        if(this.engBtn.classList.contains('active')) {
            this.switchLan()
        }
    }

    reset() {
        this.clear()
        this.pitchInput.remove()
        this.confirmBtn.remove()
        this.cancelBtn.remove()
        this.backBtns.append(this.editBtn, this.nextBtn, this.addBtn)
    }

    fillCard = (card, editMode) => {
        this.frontKanji.innerText = card.kanji
        this.kanji.value = card.kanji
        this.tags.value = card.tags

        if(!editMode) {
            this.pitchInput.remove()
            this.hiragana.remove()
            this.tags.after(this.pitch)
            this.getPitchSpans(card).forEach( span => {
                this.pitch.append(span)
            })
        } else {
            this.hiragana.value = card.hiragana
            this.pitchInput.value = card.pitch
        }
        this.fillDefinition(card)
    }

    fillHiragana = ({hiragana}) => {
        this.hiragana.value = hiragana
    }

    fillPitch = ({pitch}) => {
        this.pitch.value = pitch
    }

    fillDefinition = ({eng_def, jap_def}) => {
        if(this.getLang() === "jap") {
            if(typeof jap_def === 'string') {
                this.textArea.value = jap_def
            } else {
                let definition = jap_def.reduce((accumulator, current) => {
                    return accumulator + '\n\n' + current
                })
                this.textArea.value = definition
            }
        } else {
            if(typeof eng_def === 'string') {
                this.textArea.value = eng_def
            } else {
                let definition = eng_def.reduce((accumulator, current) => {
                    return accumulator + '\n\n' + current
                })
                this.textArea.value = definition
            }
        }
    }

    enterEditMode = () => {
        this.clear()
        this.removeArrows()
        this.removeEditNextAddBtns()
        this.appendConfirmCancelBtns()
        this.pitch.remove()
        this.removeReadonly()
        this.tags.after(this.hiragana)
        this.hiragana.after(this.pitchInput)
    }

    switchLan = () => {
        this.japBtn.classList.toggle('active')
        this.engBtn.classList.toggle('active')

        if(this.getLang() === "jap") {
            this.textArea.placeholder = "Japanese Definition"
        } else {
            this.textArea.placeholder = "English Definition"
        }
    }

    errorHighlight = (component) => {
        switch (component) {
            case "kanji":
                console.log("case triggered")
                this.kanji.classList.add('error')
                break
            case "tags":
                this.tags.classList.add('error')
                break
            case "hiragana":
                this.hiragana.classList.add('error')
                break
            case "pitch" :
                this.pitchInput.classList.add('error')
                break
            case "textArea":
                this.textArea.classList.add('error')
                break
            default:
                break;
        }
    }

    removeErrorHighlight = (target) => {
        target.classList.remove('error')
    }

    removeReadonly = () => {
        this.kanji.removeAttribute('readonly')
        this.tags.removeAttribute('readonly')
        this.hiragana.removeAttribute('readonly')
        this.textArea.removeAttribute('readonly')
    }

    makeReadonly = () => {
        this.kanji.setAttribute('readonly', 'true')
        this.tags.setAttribute('readonly', 'true')
        this.hiragana.setAttribute('readonly', 'true')
        this.textArea.setAttribute('readonly', 'true')
    }

    isReadonly = () => {
        return this.textArea.hasAttribute('readonly')
    }

    makeTextAreaReadonly = () => {
        this.textArea.setAttribute('readonly', true)
    }

    removeTextAreaReadonly = () => {
        this.textArea.removeAttribute('readonly')
    }

    appendConfirmCancelBtns = () => {
        this.backBtns.append(this.cancelBtn)
        this.backBtns.append(this.confirmBtn)
    }

    removeConfirmCancelBtns = () => {
        this.cancelBtn.remove()
        this.confirmBtn.remove()
    }

    appendEditNextAddBtns = () => {
        this.backBtns.append(this.editBtn)
        this.backBtns.append(this.nextBtn)
        this.backBtns.append(this.addBtn)
    }

    removeEditNextAddBtns = () => {
        this.editBtn.remove()
        this.nextBtn.remove()
        this.addBtn.remove()
    }

    getData = () => {
        let kanji = this.kanji.value
        let hiragana = this.hiragana.value
        let tags = this.tags.value

        return {kanji, hiragana, tags}
    }

    getTextData = () => {
        return this.textArea.value
    }

    updatePlaceholder = (text) => {
        this.textArea.placeholder = text
    }

    updateKanji = (newKanji) => {
        this.kanji.value = newKanji
    }

    getPitch = () => {
        return this.pitchInput.value
    }

    getLang = () => {
        return this.japBtn.classList.contains('active') ? 'jap' : 'eng'
    }

    getVariants = () => {
        let variants = this.textArea.value.match(/(?<=\$).*(?=\$)/g)
        if (variants) {
            return variants[0]
        } else return null
    }

    getPitchSpans = ({pitch, hiragana}) => {
        if (pitch.length == 0) throw "No pitch to get?"

        var temp_container = []

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
            temp_container.push(new_kana)
        }
        return temp_container;
    }

    colorPrioBtns = (priority) => {
        for (const prioBtn of this.prioMeter.children) {
            if(parseInt(prioBtn.id.split('-')[1]) <= priority) {
                prioBtn.classList.add('active')
            }
        }
    } 

    updatePrioBtns = (priority) => {
        for (const prioBtn of this.prioMeter.children) {
            if(parseInt(prioBtn.id.split('-')[1]) > priority && prioBtn.classList.contains('active')) {
                prioBtn.classList.toggle('active')
            }
        }
    }

    resizeFrontKanji() {
        switch(this.frontKanji.innerText.length) {
            case 1:
                this.frontKanji.style.fontSize = '8rem'
                break;
            case 2:
                this.frontKanji.style.fontSize = '8rem'
                break;
            case 3:
                this.frontKanji.style.fontSize = '6rem'
                break;
            case 4:
                this.frontKanji.style.fontSize = '6rem'
                break;
            default:
                this.frontKanji.style.fontSize = '4rem'
                break;
        }
    }

    appendArrows = () => {
        this.kanji.before(this.leftArrow)
        this.kanji.after(this.rightArrow)
    }

    removeArrows = () => {
        this.leftArrow.remove()
        this.rightArrow.remove()
    }

    getJapBtn = () => {
        return this.japBtn
    }

    getEngBtn = () => {
        return this.engBtn
    }

    getEditBtn = () => {
        return this.editBtn
    }

    getNextBtn = () => {
        return this.nextBtn
    }

    getAddBtn = () => {
        return this.addBtn
    }

    getConfirmBtn = () => {
        return this.confirmBtn
    }

    getCancelBtn = () => {
        return this.cancelBtn
    }

    getNotesBtn = () => {
        return this.notesBtn
    }

    getPrioBtns = () => {
        let buttons = []
        for (const btn of this.prioMeter.children) {
            buttons.push(btn)
        }
        console.log("Prio btns: ", buttons)
        return buttons
    }

    getLeftArrowBtn = () => {
        return this.leftArrow
    }

    getRightArrowBtn = () => {
        return this.rightArrow
    }
}

exports.ContainerCard = ContainerCard
