// ==UserScript==
// @name         Zendesk custom macros by Grzegorz Ptaszynski Additional features WIP
// @namespace    http://tampermonkey.net/
// @version      2024-12-28
// @description  macro helper to ease the pasting of templates
// @author       Grzegorz Ptaszynski
// @match        https://ryanairsupport.zendesk.com/agent/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_openInTab
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        window.close
// @grant        GM_addStyle
// @match        https://app.smartsheet.com/sheets/V9qmvXM8rj3CFJ3XwV8f5Qr6JMfcQHQCq3QP2qr1?view=grid
// @grant        GM_log
// @grant        GM_setValue
// @grant        GM_listValues

// ==/UserScript==

if (
  window.location.href ==
  "https://app.smartsheet.com/sheets/V9qmvXM8rj3CFJ3XwV8f5Qr6JMfcQHQCq3QP2qr1?view=grid"
) {
  ;(function () {
    "use strict"

    // Save original open method
    const originalOpen = XMLHttpRequest.prototype.open

    // Override the open method
    XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
      const self = this

      // Check if the URL matches the file you want to intercept
      if (url.includes("home?formName=ajax&formAction=fa_loadSheet&ss_v=")) {
        // || url.includes('home?formName=ajax&formAction=fa_loadSheet&ss_v=381.0.0')) {  // Replace with actual part of the URL
        // Listen for when the request completes
        this.addEventListener("load", function () {
          if (self.status === 200) {
            const fileContent = self.responseText // Get response as text (assuming it's a text file)
            GM_setValue("sheetData", fileContent)
            //console.log(fileContent)
            window.close()
          }
        })
      }

      // Call the original open method
      originalOpen.call(this, method, url, async, user, pass)
    }
  })()
} else {
  let sheetData = undefined
  let titleArray = []
  let contentArray = []
  function DataInsertStart() {
    titleArray = []
    contentArray = []
    GM_openInTab(
      "https://app.smartsheet.com/sheets/V9qmvXM8rj3CFJ3XwV8f5Qr6JMfcQHQCq3QP2qr1?view=grid",
      { loadInBackground: true, insert: true },
    )
    setTimeout(() => {
      sheetData = GM_getValue("sheetData", undefined)
      //console.log(sheetData)
      const matches = Array.from(
        sheetData.matchAll(/(?<=\')(?!\,)[A-Z, .0-9\\%£$€\[\];:*"@\-+=|\(\)x&~#?!\{\}\`’/]+(?=\')/gi),
      )
      const words = matches.map((match) => match[0])
      //console.log()
      const filteredWords = words.filter(
        (x) => x != "DO NOT CHANGE column titles or this column",
      )
      filteredWords.pop()
      filteredWords.splice(0, 23)
      //console.log(filteredWords)
      for (let i = 0; i < filteredWords.length; i++) {
        if (filteredWords[i] === "TITLE COLUMN") {
          titleArray.push(filteredWords[i + 1]) // The next element is the one we want
        }
      }
      for (let i = 0; i < filteredWords.length; i++) {
        if (filteredWords[i] === "CONTENT COLUMN") {
          contentArray.push(filteredWords[i + 1]) // The next element is the one we want
        }
      }
      //almostTitleArray.filter((x)=>x!=undefined)
      //console.log(titleArray, contentArray)
    }, 5000)
  }

  DataInsertStart()
  let isPromptBoxActive = false
  GM_addStyle(`
        #custom-prompt-input {
            width: 300px;
            padding: 8px;
            font-size: 16px;
        }
    `)
  function onEditableClick() {
   //console.log("article data", returnArticleData())
    //    createMessageBox("pick the macro you want, it will be ready to paste when you click it",10000)
    // Trigger the custom prompt with predefined options
    //console.log(isPromptBoxActive)
    if (!isPromptBoxActive) {
      //console.log(789)
      showDatalistPrompt("Please select macro:", titleArray)
    }
    // Convert NodeList to an array using Array.from
    function returnArticleData() {
      const articleData = Array.from(articles)
        .map((article) => {
          const paragraphs = article.querySelectorAll(".zd-comment") //:not(blockquote):not(tr)
          //console.log(article)
          if (
            article.querySelector('div[type="end-user"]') !== null &&
            document.querySelector('[data-test-id="tooltip-requester-name"]')
              .textContent ===
              Array.from(article.querySelectorAll("span"))[0].textContent
          ) {
            return Array.from(paragraphs).map((p) => p.textContent.trim())
          } else {
            return " "
          }
        })
        .map((element) => {
          if (Array.isArray(element)) {
            return element.join(" ")
          } else {
            return element
          }
        })
        .map((element) => {
          return cutNs(
            element
              .replaceAll(
                "The content of this e-mail or any file or attachment transmitted with it may have been changed or altered without the consent of the author. If you are not the intended recipient of this e-mail, you are hereby notified that any review, dissemination, disclosure, alteration, printing, circulation or transmission of, or any action taken or omitted in reliance on this e-mail or any file or attachment transmitted with it is prohibited and may be unlawful. If you have received this e-mail in error please notify Ryanair Holdings plc by contacting Ryanair Holdings plc (Company No. 249885) / Ryanair DAC. (Company No. 104547). Registered in the Republic Of Ireland. Airside Business Park, Swords, Co Dublin, Ireland.",
                "",
              )
              .replaceAll("EXTERNAL EMAIL:", "")
              .replaceAll(
                "This email originated from outside of the Organisation. Do not click links or open attachments unless you recognise the sender and know the content is safe.",
                "",
              )
              .replaceAll(
                "EXTERNAL EMAIL:\n\t\t\n\t\n\tThis email originated from outside of the Organisation. Do not click links or open attachments unless you recognise the sender and know the content is safe.",
                "",
              ),
          )
            .split("\t")
            .join(" ")
        })
        .join(" ")
        .split(" ")

      //.split(" ")
      function cutNs(inputString) {
        // Split the string by '\n' into an array
        const parts = inputString.split("\n")

        // Take the first 10 parts and join them back with '\n'
        const first10Lines = parts.slice(0, 10).join(" ")

        return first10Lines
      }
      const articleDataNoEmpty = articleData.filter((element) => element !== "")
      return articleDataNoEmpty
    }

    //WORKS // GM_openInTab("https://www.youtube.com/")
    //let currentActiveElement = document.activeElement
    //currentActiveElement.innerHTML = "eebydeeby"
    //        .filter((element)=>{if(element!="EXTERNAL EMAIL:\n\t\t\n\t\n\tThis email originated from outside of the Organisation. Do not click links or open attachments unless you recognise the sender and know the content is safe."){return true}})

    // setReactInputValue(currentActiveElement,"test1")
  }
  //bruh, literally nothing works, god dammit, it just resets my shiz after every input attempt
  //function setReactInputValue(el, value) {
  //    // Store the last value to update React's internal tracker
  //    const last = el.value;
  //  // Use the native value setter to change the input's value
  // const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  //      window.HTMLInputElement.prototype,
  //      'value'
  //  ).set;
  //  nativeInputValueSetter.call(el, value);
  //  // Update React's internal value tracker
  //  const event = new Event('input', { bubbles: true });
  //  const tracker = el._valueTracker;
  //  if (tracker) {
  //      tracker.setValue(last);
  //  }
  // Dispatch the input event to notify React of the change
  //   el.dispatchEvent(event);
  //}

  //GM_openInTab("https://www.example.com/");

  //GM_setClipboard("This is the clipboard text.", "text", () => console.log("Clipboard set!"));
  //await GM.setClipboard("This is the newer clipboard text.", "text");
  //console.log('Clipboard set again!');

  //GM_getTabs((tabs) => {
  //    for (const [tabId, tab] of Object.entries(tabs)) {
  //        console.log(`tab ${tabId}`, tab);
  //    }
  //});

  let articles = []

  // Usage example with async/await to get the value
  async function getResult() {
    try {
      const result = await articleYoink() // Wait for the result from articleYoink
      return result // Return the result when it's ready
    } catch (error) {
      console.error(error) // Handle any errors (though in this case, it's unlikely)
    }
  }
  let recentConvoDate = undefined
  // Calling the function and returning the value from the async function
  //getResult().then((result) => {
  //  recentConvoDate = result
  //})

  function showDatalistPrompt(message, options) {
    //let promptTimeout = setTimeout(() => {alert('a')}, 2000);
    isPromptBoxActive = true
    // function fadeLoop(){
    //    if(isContentEditable()){
    // clearTimeout(promptTimeout);
    //   promptTimeout
    //    }
    // setTimeout(()=>{fadeLoop()},200)
    // }
    const promptContainer = document.createElement("div")
    promptContainer.style.position = "fixed"
    promptContainer.style.top = "5px"
    promptContainer.style.left = "85%"
    promptContainer.style.transform = "translateX(-50%)"
    promptContainer.style.backgroundColor = "#4CAF50"
    promptContainer.style.padding = "10px 20px"
    promptContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"
    promptContainer.style.zIndex = "9999"
    promptContainer.style.color = "white"

    // Create a prompt message element
    const messageElement = document.createElement("p")
    messageElement.textContent = message
    promptContainer.appendChild(messageElement)

    // Create a datalist
    const datalist = document.createElement("datalist")
    datalist.id = "prompt-datalist"

    // Create a container to simulate the datalist
    const datalistContainer = document.createElement("div")
    datalistContainer.style.maxHeight = "200px"
    datalistContainer.style.overflowY = "auto"
    datalistContainer.style.backgroundColor = "white"
    datalistContainer.style.border = "1px solid #ccc"
    datalistContainer.style.position = "absolute"
    datalistContainer.style.top = "100px"
    datalistContainer.style.width = "200px"
    datalistContainer.style.zIndex = "9999"
    datalistContainer.style.borderRadius = "4px"
    datalistContainer.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)"

    // Add options to the datalist
    options.forEach((option) => {
      const optionElement = document.createElement("div")
      optionElement.value = option
      optionElement.innerText = option
      optionElement.style.color = "black"
      optionElement.style.padding = "5px"
      optionElement.style.cursor = "pointer"
      optionElement.style.borderBottom = "2px solid #f0f0f0"

      optionElement.onmouseover = () => {
    optionElement.style.backgroundColor = "#f0f0f0" // Optional: highlight on hover
    const messageBox = document.createElement("div")
    messageBox.id = options.indexOf(option)
    messageBox.style.position = "fixed"
    messageBox.style.top = "150px"
    messageBox.style.left = "10px"
   // messageBox.style.transform = "translateX(10%)"
    messageBox.style.backgroundColor = "#4CAF50"
    messageBox.style.color = "white"
    messageBox.style.padding = "10px 20px"
    messageBox.style.borderRadius = "5px"
    messageBox.style.fontSize = "16px"
    messageBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"
    messageBox.style.zIndex = "9999"
    messageBox.style.display = "none"
    messageBox.style.maxWidth = '50%';
    document.body.appendChild(messageBox)

       decode(contentArray[options.indexOf(`${option}`)])
          .then((result) => {messageBox.innerText = result;messageBox.style.display = "block"})
      }
      optionElement.onmouseleave = ()=>{
      document.getElementById(options.indexOf(option)).remove()
      }
      optionElement.onmouseout = () => {
        optionElement.style.backgroundColor = "" // Reset highlight
      }
      optionElement.onmousedown = () => {
          document.getElementById(options.indexOf(option)).remove()
        select(optionElement,false)
      }
      datalistContainer.appendChild(optionElement)
      promptContainer.appendChild(datalistContainer)
    })
    document.body.appendChild(datalist)
    const confirmButton = document.createElement("button")
    confirmButton.textContent = "Copy nothing and close"
    confirmButton.style.marginTop = "5px"
    confirmButton.style.padding = "5px"
    confirmButton.onclick = function () {
      select(inputElement)
    }
    promptContainer.appendChild(confirmButton)
    // Create an input field linked to the datalist
    const inputElement = document.createElement("input")
    inputElement.setAttribute("list", "prompt-datalist")
    inputElement.setAttribute("placeholder", "Select an option")
    inputElement.style.fontSize = "20px" // Adjust text size
    inputElement.style.padding = "5px" // Add padding
    inputElement.style.height = "30px" // Set height
    inputElement.style.width = "200px"
    promptContainer.appendChild(inputElement)
    //inputElement.onchange(function(){if(inputElement.value!=undefined||inputElement.value!=null||inputElement.value!=""){console.log(inputElement.value)}})
    // Add the prompt container to the body
    document.body.appendChild(promptContainer)
    //inputElement.addEventListener("input", select) //this method works
    // Create a confirm button

    function select(option,returnNotCopy=false) {
      isPromptBoxActive = false
      let resultOfFunction = undefined
      const userInput = option.value
        .replace(/%5cn/g, "\n") // Use a global regular expression to replace all occurrences of '%5cn' with a newline
        .replace(/\[RECENTDATE\]/g, recentConvoDate.toString())
      if (options.includes(userInput)) {
        decode(contentArray[options.indexOf(`${userInput}`)])
          .then((result) => {
            if(returnNotCopy){result = resultOfFunction;return}
            navigator.clipboard
              .writeText(result)
              .catch((err) => {
                console.error("Error copying to clipboard: ", err) // Error handling
              })
          })
          .catch((error) => {
            console.error("Error decoding string: ", error) // Error handling for decode
          })
        //                navigator.clipboard.writeText((contentArray[options.indexOf(`${userInput}`)]));
          console.log(resultOfFunction)
        if(returnNotCopy){return resultOfFunction}
          createMessageBox(`Copied ${userInput}!`, 5000)
      } else {
        createMessageBox("Copying nothing, like you wanted!", 3000)
      }
      document.body.removeChild(promptContainer)
      document.body.removeChild(datalist)
    }
  }

  //const tabs = await GM.getTabs();
  function setTextInParagraph(text) {
    // Get the currently focused element (active element)
    const activeElement = document.activeElement

    // Find the first <p> element inside the activeElement
    const pElement = activeElement.querySelector("p")

    // If a <p> element is found, set its text content
    if (pElement) {
      pElement.textContent = text // Sets the text of the <p> element
    }
  }
  function isContentEditable() {
    // Get the currently focused element
    const activeElement = document.activeElement
    // Check if the active element is a div and if it has the contenteditable attribute set to true
    if (activeElement && activeElement.tagName === "DIV") {
      return activeElement.getAttribute("contenteditable") === "true"
    }
    return false
  }
  function contenteditableCheck() {
    if (isContentEditable()) {
      //console.log("This div is editable.");

      onEditableClick()
    } else {
      //console.log("This div is not editable.");
    }
  }

  var debugCount = 0
  function refresh() {
    setTimeout(() => {
      debugCount = 0 //console.log(`it has been ${debugCount} seconds since start of program`);refresh();debugCount+=5
    }, 5000)
  }
  refresh() //this makes the script not randomly stop working...somehow
  function createMessageBox(message, time) {
    const messageBox = document.createElement("div")
    messageBox.innerHTML = message
    messageBox.style.position = "fixed"
    messageBox.style.top = "150px"
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
  document.addEventListener("mouseup", contenteditableCheck)
  // Function to extract the recent conversation date from the articles
  async function articleYoink() {
    //recentConvoDate = undefined
    return new Promise((resolve, reject) => {
      function checkArticles() {
        if (articles.length < 1) {
          articles = document.querySelectorAll("article")
          setTimeout(checkArticles, 200)
        } else {
          const date = recentConversationDate()
          recentConvoDate = date // Set the date
          if (recentConvoDate) {
            resolve(recentConvoDate) // Resolve with the date
          } else {
            reject("No recent conversation date found")
          }
        }
      }

      checkArticles() // Start checking for articles
    })
  }

  // Function to extract the recent date
  function recentConversationDate() {
    // Assuming 'article' is the variable you're working with
    function checkIfNested(article) {
      // Ensure article is valid
      if (!article) {
        console.error("The article element is undefined or null.")
        return false
      }

      // Loop through the parents of the article
      let currentElement = article
      let nestCount = 0

      // We keep moving up until there are no more parents (currentElement becomes null)
      while (currentElement && currentElement.parentNode) {
        currentElement = currentElement.parentNode
        nestCount++

        // Make sure currentElement exists and is valid
        if (currentElement.className === "ember-view workspace") {
          //console.log("check")
          // Check if the style attribute is empty
          if (currentElement.getAttribute("style") === "") {
            //if (nestCount === 20) {
            //console.log("Found parent")
            return true
            //}
          }
        }
      }

      //console.log("No matching parent found")
      return false
    }
    const articlesWithEndUserType = Array.from(articles).filter((article) => {
      const innerHTML = Array.from(article.querySelectorAll("span"))
      return (
        article.querySelector('div[type="end-user"]') !== null &&
        document.querySelector('[data-test-id="tooltip-requester-name"]')
          .textContent === innerHTML[0].textContent //&&
        //checkIfNested(article)
      )
    })

    //console.log(articlesWithEndUserType)
    const dates = articlesWithEndUserType.map((article) => {
      const timeElement = article.querySelector("time")
      return timeElement ? timeElement.getAttribute("datetime") : null
    })

    if (dates.length === 0) {
      return undefined // Return undef if no date
    }
    //console.log(dates)
    const recentDate = dates.pop()
    const correctTimeFormat = recentDate
      ? recentDate.slice(0, 10).split("-", 3).reverse().join("/")
      : undefined
    return correctTimeFormat
  }

  // Function to replace [RECENTDATE] in a string with the actual date
  async function processString(inputString) {
    // Wait for the recentConvoDate to be set
    await articleYoink()

    // Ensure recentConvoDate is available
    if (recentConvoDate) {
      // Decode URL-encoded characters and replace [RECENTDATE] with the date
      let decodedString = inputString.replace(/%5cn/g, "\n")

      // Replace [RECENTDATE] with the actual date
      let finalString = decodedString.replace(
        /\[RECENTDATE\]/g,
        recentConvoDate,
      )

      // Return the final string with replacements
      return finalString
    } else {
      // Return a message if recentConvoDate is not available yet
      return "recentConvoDate is not available yet."
    }
  }

  // Example usage: calling the function with a string
  async function decode(inputString) {
    const result = await processString(inputString) // Get the result
    return result // Log or use the result
  }

  // Function to handle URL change
  function handleUrlChange() {
    let count = 0
    //const articles = document.querySelectorAll("article")
    if (window.location.href.indexOf("/agent/tickets/") != -1) {
      dateRefresh()
    }
    //articles.forEach((element)=>{element.remove()})
    function dateRefresh() {
      if (count < 10) {
        count++
        articles = []
        setTimeout(() => {
          getResult().then((result) => {
            recentConvoDate = result
            console.log(recentConvoDate) //, articles)
            if (recentConvoDate == undefined) {
              dateRefresh()
            }
          })
        }, 500)
      }
    }
  }
  // Initial URL check

  handleUrlChange()

  // Listen for URL changes using popstate event
  window.addEventListener("popstate", handleUrlChange)

  // Also listen for pushState or replaceState method calls to detect changes in single-page apps
  const originalPushState = history.pushState
  history.pushState = function () {
    originalPushState.apply(this, arguments)
    handleUrlChange() // Handle URL change
  }

  const originalReplaceState = history.replaceState
  history.replaceState = function () {
    originalReplaceState.apply(this, arguments)
    handleUrlChange() // Handle URL change
  }
}
