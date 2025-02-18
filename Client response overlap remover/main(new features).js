// ==UserScript==
// @name         client respond append fix by Grzegorz Ptaszynski
// @namespace    http://tampermonkey.net/
// @match        https://ryanairsupport.zendesk.com/agent/*
// @grant        none
// @description
// @author Grzegorz Ptaszynski
// ==/UserScript==
//welcome to the word of barelly comprehensible spaghetti
//if you are wondering "why vars not lets? why not put a foreach instead of a for?"
//the answer is they just dont work with zendesk for some reason :/

//for message
var count = 0
var idCounter = 0
function idMaker() {
  return `greasemonkeyelementnr${idCounter++}`
}
//catches all <blockquote> html elements and puts them in array, then hides them
function getAllBlockquotes() {
  const blockquotes = document.getElementsByTagName("blockquote")
  const num = blockquotes.length
  count += num
  for (var i = 0; i < blockquotes.length; i++) {
    var element = blockquotes[i]
    if (element) {
      element.hidden = true
    }
  }
}
//catches all <tr> html elements and puts them in array, then hides them
function getAllResponseTables() {
  const tables = document.getElementsByTagName("tr")
  const num = tables.length
  count += num
  for (var i = 0; i < tables.length; i++) {
    var element = tables[i]
    if (element) {
      element.hidden = true
    }
  }
}
//kill processes function
function killResponses() {
  getAllResponseTables()
  getAllBlockquotes()
  showMessage(`removed ${count} of annoying objects`)
  count = 0
}

//creates the green message box to show amount of deleted stuff
function createMessageBox(message, time) {
  const id = idMaker()
  const messageBox = document.createElement("div")
  messageBox.id = id
  const element = document.getElementById(id)
  messageBox.innerHTML = message
  messageBox.style.position = "fixed"
  messageBox.style.top = "20px"
  messageBox.style.left = "50%"
  messageBox.style.transform = "translateX(-50%)"
  messageBox.style.backgroundColor = "#4CAF50"
  messageBox.style.color = "white"
  messageBox.style.padding = "10px 20px"
  messageBox.style.borderRadius = "5px"
  messageBox.style.fontSize = "16px"
  messageBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"
  messageBox.style.zIndex = "9999"
  messageBox.style.display = "none"

  document.body.appendChild(messageBox)

  setTimeout(() => {
    messageBox.style.display = "block"
  }, 100)
  setTimeout(() => {
    messageBox.remove()
  }, time)
}
// Shows the custom message
function showMessage(message) {
  createMessageBox(message, 3000)
}
var debugCount = 0
function refresh() {
  setTimeout(() => {
    debugCount = 0 //console.log(`it has been ${debugCount} seconds since start of program`);refresh();debugCount+=5
  }, 5000)
}
refresh() //this makes the script not randomly stop working...hopefully
// for (var i = 1; i < 31; i++) {setTimeout(()=>{getAllBlockquotes();getAllResponseTables()},i*500)}
function handleKeyPress(event) {
  if (event.altKey && event.key === "n") {
    killResponses()
  }
}
document.addEventListener("keydown", handleKeyPress)
window.addEventListener("beforeunload", function () {
  document.removeEventListener("keydown", handleKeyPress)
})
//watches if client higlighted elements for deletion
function isSelectionInsideElement(selection, tagName) {
  let selectedNode = selection.anchorNode
  // Ensure selectedNode is an element, not a text node
  if (selectedNode && selectedNode.nodeType === 3) {
    // If it's a text node, get its parent element
    selectedNode = selectedNode.parentElement
  }
  return selectedNode && selectedNode.closest(tagName) !== null
}

// Event listener for client selection
function onSelectionChange() {
  const selection = window.getSelection()
  if (!selection.isCollapsed) {
    // Checks if the selection is inside a <tr> or <blockquote> element
    if (
      isSelectionInsideElement(selection, "tr") ||
      isSelectionInsideElement(selection, "blockquote")
    ) {
      createPromptBox("kill responses?(Alt+n)", 6000) //console.log('Text selected inside a <tr>: ', selection.toString());
    }
  }
}
//cooldown so the prompt doesnt pop up 200 times a second
var selectionCooldown = false

//sets up prompt box
function createPromptBox(message, time, id) {
  if (!selectionCooldown) {
    const id = idMaker()
    selectionCooldown = true
    const promptBox = document.createElement("div")
    promptBox.id = id
    const element = document.getElementById(id)
    promptBox.innerHTML = message
    promptBox.style.position = "fixed"
    promptBox.style.top = "20px"
    promptBox.style.left = "50%"
    promptBox.style.transform = "translateX(-50%)"
    promptBox.style.backgroundColor = "#0050b2"
    promptBox.style.color = "white"
    promptBox.style.padding = "10px 20px"
    promptBox.style.borderRadius = "5px"
    promptBox.style.fontSize = "16px"
    promptBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"
    promptBox.style.zIndex = "9999"
    promptBox.style.display = "none"

    const buttonContainer = document.createElement("div")
    buttonContainer.style.marginTop = "20px"

    const yesButton = document.createElement("button")
    promptBox.style.cssFloat = "left"
    yesButton.innerText = "Yes"
    yesButton.style.marginRight = "10px"
    yesButton.addEventListener("click", () => {
      promptBox.remove()
      killResponses()
    })
    const noButton = document.createElement("button")
    promptBox.style.cssFloat = "right"
    noButton.innerText = "No"
    noButton.addEventListener("click", () => {
      promptBox.remove()
      createMessageBox("ok, I'll go away now", 2000)
    })
    buttonContainer.appendChild(yesButton)
    buttonContainer.appendChild(noButton)

    promptBox.appendChild(buttonContainer)

    document.body.appendChild(promptBox)

    setTimeout(() => {
      promptBox.style.display = "block"
    }, 100)
    setTimeout(() => {
      promptBox.remove()
    }, time)
    setTimeout(() => {
      selectionCooldown = false
    }, 10000)
  }
}
document.addEventListener("selectionchange", onSelectionChange)
