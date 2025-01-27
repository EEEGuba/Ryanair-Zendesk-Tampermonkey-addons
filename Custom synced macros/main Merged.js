// ==UserScript==
// @name         Zendesk custom macros by Grzegorz Ptaszynski merge attempt
// @namespace    http://tampermonkey.net/
// @version      2024-12-28
// @description  macro helper to ease the pasting of templates
// @author       Grzegorz Ptaszynski
// @match        https://ryanairsupport.zendesk.com/agent/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_openInTab
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @match        https://app.smartsheet.com/sheets/qG3Jjrg3fVPXmRQgP9rHx2X6CjQhWCPCH2XRPQ51?view=grid
// @grant        GM_log
// @grant        GM_setValue
// @grant        GM_listValues
// ==/UserScript==

if (
    window.location.href ==
    "https://app.smartsheet.com/sheets/qG3Jjrg3fVPXmRQgP9rHx2X6CjQhWCPCH2XRPQ51?view=grid"
) {
    ; (function () {
        "use strict"
        // Save original open method
        const originalOpen = XMLHttpRequest.prototype.open
        // Override the open method
        XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
            const self = this
            if (url.includes("home?formName=ajax&formAction=fa_loadSheet&ss_v=")) {
                this.addEventListener("load", function () {
                    if (self.status === 200) {
                        const fileContent = self.responseText // Get response as text (assuming it's a text file)
                        GM_setValue("sheetData", fileContent)
                        window.close()
                    }
                })
            }
            // Call the original open method
            originalOpen.call(this, method, url, async, user, pass)
        }
    })()
} else {
    let currentTicketNr = window.location.href.toString().split("/").pop()
    let sheetData = undefined
    let titleArray = []
    let contentArray = []
    let keywordArray = []
    let articles = []
    let recentConvoDate = undefined
    let isPromptBoxActive = false
    let boxCount = 0
    let debugCount = 0
    let macroArray = []
    function DataInsertStart() {
        titleArray = []
        contentArray = []
        keywordArray = []
        GM_openInTab(
            "https://app.smartsheet.com/sheets/qG3Jjrg3fVPXmRQgP9rHx2X6CjQhWCPCH2XRPQ51?view=grid",
            { loadInBackground: true, insert: true },
        )
        setTimeout(() => {
            sheetData = GM_getValue("sheetData", undefined)
            const matches = Array.from(
                sheetData.matchAll(
                    /(?<=\')(?!\,)[A-Z, .0-9\\%£$€\[\];:*"@\-+=|\(\)x&~#?!\{\}\`’/]+(?=\')/gi,
                ),
            )
            const words = matches.map((match) => match[0])
            const filteredWords = words.filter(
                (x) => x != "DO NOT CHANGE column titles or this column",
            )
            filteredWords.pop()
            filteredWords.splice(0, 4)
            for (let i = 0; i < filteredWords.length; i++) {
                if (filteredWords[i] === "TITLE COLUMN") {
                    titleArray.push(filteredWords[i + 1])
                }
            }
            for (let i = 0; i < filteredWords.length; i++) {
                if (filteredWords[i] === "CONTENT COLUMN") {
                    contentArray.push(filteredWords[i + 1])
                }
            }
            for (let i = 0; i < filteredWords.length; i++) {
                if (filteredWords[i] === "KEYWORDS COLUMN") {
                    keywordArray.push(filteredWords[i + 1])
                }
            }
            for (let i = 0; i < titleArray.length; i++) {
                if (titleArray[i] != "TITLE COLUMN" && titleArray[i] != "KEYWORD COLUMN" && titleArray[i] != "CONTENT COLUMN") {
                    macroArray.push(new macro(i, titleArray[i], contentArray[i], i))

                }
                function macro(index, title, content, relevancePoints) {
                    this.index = index
                    this.title = title
                    this.content = content
                    this.relevancePoints = relevancePoints
                }
            }
        }, 1000)//timeout needed, breaks otherwise
    }

    DataInsertStart()
    GM_addStyle(`
          #custom-prompt-input {
              width: 300px;
              padding: 8px;
              font-size: 16px;
          }
      `)
    function onEditableClick() {
        if (!isPromptBoxActive) {
            showDatalistPrompt("Please select macro", macroArray)
        }
    }
    //below U N F I N I S H E D, CUTS OFF LATTER PARTS OF MAILS
    function returnArticleData() {
        let cutNumber = 0

        const articleData = Array.from(articles)
            .map((article) => {
                const paragraphs = article.querySelectorAll(".zd-comment") //:not(blockquote):not(tr)
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
        function cutNs(inputString) {

            // Split the string by '\n' into an array
            let index = 0
            let parts = inputString.split("\n")
            parts.forEach((element)=>{
            if(element === ""){cutNumber++}else{cutNumber = 0}
                index++
            if (cutNumber>=4){parts = parts.slice(0,index);return}
            })
            return parts.join(" ")
        }
        const articleDataNoEmpty = articleData.filter((element) => element !== "")
        return articleDataNoEmpty
    }

    //End of U N F I N I S H E D
    async function getResult() {
        try {
            const result = await articleGrabber() // Wait for the result from articleGrabber
            return result // Return the result when it's ready
        } catch (error) {
            console.error(error) // Handle any errors (though in this case, it's unlikely)
        }
    }

    function showDatalistPrompt(message, options) {
        let displayList=options
        isPromptBoxActive = true;
        const promptContainer = document.createElement("div");
        promptContainer.id = "macro-prompt";
        promptContainer.style.position = "fixed";
        promptContainer.style.top = "5px";
        promptContainer.style.left = "83%";
        promptContainer.style.transform = "translateX(-50%)";
        promptContainer.style.backgroundColor = "#4CAF50";
        promptContainer.style.padding = "5px 10px";
        promptContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        promptContainer.style.zIndex = "9999";
        promptContainer.style.color = "white";
        promptContainer.style.width = "220px"; // Set a fixed width for the container to avoid drastic shifts

        // Create the header container (text + close button)
        const headerContainer = document.createElement("div");
        headerContainer.style.display = "flex";
        headerContainer.style.justifyContent = "space-between";
        headerContainer.style.alignItems = "center";
        headerContainer.style.whiteSpace = "nowrap"; // Prevent the text from wrapping

        // Create a prompt message element
        const messageElement = document.createElement("p");
        messageElement.textContent = message;
        messageElement.style.margin = "0"; // Remove default margin to avoid spacing issues
        messageElement.style.flexGrow = "1"; // Allow the message to take up available space
        messageElement.style.fontSize = "20px"
        headerContainer.appendChild(messageElement);

        // Create the "x" button (close button) and position it in the top right
        const closeButton = document.createElement("div");
        closeButton.textContent = "x";
        closeButton.style.padding = "2px 10px";
        closeButton.style.fontSize = "24px";
        closeButton.style.backgroundColor = "red";
        closeButton.style.border = "none";
        closeButton.style.color = "white";
        closeButton.style.fontWeight = "bold";
        closeButton.style.cursor = "pointer";

        closeButton.style.position = "relative";
        closeButton.style.top = "-5px";
        closeButton.style.left = "10px";
        closeButton.onclick = function () {
            setTimeout(() => { isPromptBoxActive = false }, 10000)

            createMessageBox("Copying nothing, like you wanted!", 3000)
            document.body.removeChild(promptContainer)
            document.body.removeChild(datalist)
        };
        headerContainer.appendChild(closeButton);

        promptContainer.appendChild(headerContainer); // Add the header to the prompt container

        // Create a datalist
        const datalist = document.createElement("datalist");
        datalist.id = "prompt-datalist";

        // Create a container to simulate the datalist
        const datalistContainer = document.createElement("div");
        datalistContainer.style.maxHeight = "150px";
        datalistContainer.style.overflowY = "auto";
        datalistContainer.style.backgroundColor = "white";
        datalistContainer.style.border = "1px solid #ccc";
        datalistContainer.style.position = "absolute";
        datalistContainer.style.top = "99px";
        datalistContainer.style.width = "215px";
        datalistContainer.style.zIndex = "9999";
        datalistContainer.style.borderRadius = "4px";
        datalistContainer.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";

        // Add options to the datalist
        displayList.forEach((option) => {
            if (option.title != "CONTENT COLUMN" && option.title != "KEYWORDS COLUMN" && option.title != "TITLE COLUMN") {
                const optionElement = document.createElement("div");
                optionElement.value = option.title;
                optionElement.innerText = option.title;
                optionElement.style.color = "black";
                optionElement.style.padding = "5px";
                optionElement.style.cursor = "pointer";
                optionElement.style.borderBottom = "2px solid #f0f0f0";
                optionElement.id = `option${option.index}`
                optionElement.onmouseover = () => {
                    optionElement.style.backgroundColor = "#f0f0f0"; // Optional: highlight on hover
                    const messageBox = document.createElement("div");
                    messageBox.id = options.indexOf(option);
                    messageBox.style.position = "fixed";
                    messageBox.style.top = "150px";
                    messageBox.style.left = "10px";
                    messageBox.style.backgroundColor = "#4CAF50";
                    messageBox.style.color = "white";
                    messageBox.style.padding = "10px 20px";
                    messageBox.style.borderRadius = "5px";
                    messageBox.style.fontSize = "16px";
                    messageBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
                    messageBox.style.zIndex = "9999";
                    messageBox.style.display = "none";
                    messageBox.style.maxWidth = '50%';
                    document.body.appendChild(messageBox);
                    decode(option.content).then((result) => {
                        messageBox.innerText = result;
                        messageBox.style.display = "block";
                    });
                };

                optionElement.onmouseleave = () => {
                    document.getElementById(options.indexOf(option)).remove();
                };

                optionElement.onmouseout = () => {
                    optionElement.style.backgroundColor = ""; // Reset highlight
                };

                optionElement.onmousedown = () => {
                    document.getElementById(options.indexOf(option)).remove();
                    select(option, false);
                };

                datalistContainer.appendChild(optionElement);
                promptContainer.appendChild(datalistContainer);
            }
        });
        document.body.appendChild(datalist);
        const checkboxDiv = document.createElement("div")
        const checkboxText = document.createElement("small")
        checkboxText.innerText = "search content?"
        const searchContentCheckbox = document.createElement("input")
        searchContentCheckbox.setAttribute("type", "checkbox");
        checkboxDiv.style.position = "relative";
        checkboxDiv.style.top = "0px";
        checkboxDiv.style.left = "0px";
        checkboxDiv.style.width="200px"
searchContentCheckbox.addEventListener('input',search)
        // Create an input field linked to the datalist
        const inputElement = document.createElement("input");
        inputElement.setAttribute("list", "prompt-datalist");
        inputElement.setAttribute("placeholder", "Type here to search");
        inputElement.style.fontSize = "20px"; // Adjust text size
        inputElement.style.padding = "5px"; // Add padding
        inputElement.style.height = "30px"; // Set height
        inputElement.style.width = "210px";
        checkboxDiv.appendChild(checkboxText)
        checkboxDiv.appendChild(searchContentCheckbox)
promptContainer.appendChild(checkboxDiv)
        inputElement.addEventListener('input',search)

        //WIP
        //TOADD: checkbox for checking content instead of titles
function search(){
    const searchTerm = inputElement.value.toLowerCase();
    const searchContent = searchContentCheckbox.checked
   displayList.forEach(item => {
   let itemText = undefined;
       if(searchContent){itemText = item.content.toLowerCase()}else{itemText = item.title.toLowerCase()}
   if (itemText.includes(searchTerm)) {
       document.getElementById(`option${item.index}`).style.display = 'block';
   } else {
       document.getElementById(`option${item.index}`).style.display = 'none';
   }})}
        //WIP

            promptContainer.appendChild(inputElement);

        document.body.appendChild(promptContainer);

        function select(option, returnNotCopy = false) {
            isPromptBoxActive = false
            let resultOfFunction = undefined
            const userInput = option.title
                .replace(/%5cn/g, "\n") // Use a global regular expression to replace all occurrences of '%5cn' with a newline
                .replace(/\[RECENTDATE\]/g, recentConvoDate.toString())

                decode(option.content)
                    .then((result) => {
                        if (returnNotCopy) { result = resultOfFunction; return }
                        navigator.clipboard
                            .writeText(result)
                            .catch((err) => {
                                console.error("Error copying to clipboard: ", err) // Error handling
                            })
                    })
                    .catch((error) => {
                        console.error("Error decoding string: ", error) // Error handling for decode
                    })
                if (returnNotCopy) { return resultOfFunction }
                createMessageBox(`Copied ${userInput}!`, 5000)
            document.body.removeChild(promptContainer)
            document.body.removeChild(datalist)
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
            onEditableClick()
            boxCount = 0
            refreshBox()
        }
    }

    function refreshBox() {
        setTimeout(() => {
            if (recentConvoDate == undefined) {
                document.getElementById("macro-prompt").style.backgroundColor =
                    "#C72222"
            } else {
                document.getElementById("macro-prompt").style.backgroundColor =
                    "#4CAF50"
            }
            boxCount++
            if (boxCount < 50) {
                refreshBox()
            }
        }, 100)
    }
    function refreshBoxFallback() {
        setTimeout(() => {
            if (recentConvoDate == undefined) {
                document.getElementById("macro-prompt").style.backgroundColor =
                    "#C72222"
            } else {
                document.getElementById("macro-prompt").style.backgroundColor =
                    "#4CAF50"
            }
            refreshBoxFallback()
        }, 500)
    }
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
    document.addEventListener("mouseup", contenteditableCheck)
    // Function to extract the recent conversation date from the articles
    function articleGrabber() {
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
        if (
            document.querySelector('[data-test-id="tooltip-requester-name"]') == null
        ) {
            return undefined
        }
        const articlesWithEndUserType = Array.from(articles).filter((article) => {
            articles.forEach((article) => { })
            const innerHTML = Array.from(article.querySelectorAll("span"))
            // Find the closest parent element that contains this article
            let parent = article.closest("div")

            // Check if the parent contains a <div> with the desired elementtiming attribute
            let targetDiv = parent.querySelector(
                `div[elementtiming="omnilog/${currentTicketNr}"]`,
            )

            // If a target div is found within the same parent as the article
            const elements = Array.from(
                document.querySelectorAll('[data-test-id="tooltip-requester-name"]'),
            )
            const requesterCheck = elements.some((element) => {
                return element.textContent === innerHTML[0].textContent
            })
            return (
                article.querySelector('div[type="end-user"]') !== null &&
                requesterCheck &&
                Boolean(targetDiv)
            )
        })

        const dates = articlesWithEndUserType.map((article) => {
            const timeElement = article.querySelector("time")
            return timeElement ? timeElement.getAttribute("datetime") : null
        })
        if (dates.length === 0) {
            return undefined // Return undef if no date
        }
        const recentDate = dates[dates.length - 1]
        const correctTimeFormat = recentDate
            ? recentDate.slice(0, 10).split("-", 3).reverse().join("/")
            : undefined
        return correctTimeFormat
    }
    // Function to replace [RECENTDATE] in a string with the actual date
    async function processString(inputString) {
        // Wait for the recentConvoDate to be set
        await articleGrabber()

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
    function handleUrlChange() {
        boxCount = 0
        refreshBox()
        currentTicketNr = window.location.href.toString().split("/").pop()
        recentConvoDate = undefined
        let count = 0
        if (window.location.href.indexOf("/agent/tickets/") != -1) {
            dateRefresh()
        }
        function dateRefresh() {
            if (count < 10) {
                count++
                articles = []
                setTimeout(() => {
                    getResult().then((result) => {
                        console.log(returnArticleData())

                        recentConvoDate = result
                        createMessageBox(recentConvoDate, 3000)//todelete
                        if (recentConvoDate == undefined) {
                            dateRefresh()
                        }
                    })
                }, 500)
            }
        }
        function makeSure() {
            count = 8
            dateRefresh()
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
        handleUrlChange()
    }
}
