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
    //C O N F I G

    //change whatever you want in here, remember to save a working version first and make this a copy just in case

    //what works is replacing the part after the = sign with the color in quotations:
    //name of color ex. "blue";
    //hexcodes ex. "#056b00"
    //rgb ex. "rgb(155, 102, 102)"
    //save the code and reload zendesk to check if it works

    //the background color of messages and prompts(default is dark green "#056b00")
    const backgroundColor = GM_getValue('backgroundColor', "#056b00")

    //the color of the font of the messages and prompts(default is white "white")
    const fontColor = GM_getValue('fontColor', "white")

    //the color of the drag bars present at the sides of the prompt box (default is dark grey "#193818")
    const dragBarColor = GM_getValue('dragBarColor', "#193818")

    //the background color of the options in the list of macros(default is white "white")
    const optionsBackgroundColor = GM_getValue('optionsBackgroundColor', "white")

    //the background color of the search box(default is white "white")
    const inputBackgroundColor = GM_getValue('inputBackgroundColor', "white")

    //the background color of the close button(default is "red")
    const closeButtonBackgroundColor = GM_getValue('closeButtonBackgroundColor', "red")

   //the color of the drag bars present at the sides of the prompt box (default is grey "#D1D1D1")
   const settingsColor = "#D1D1D1"

    //E N D   O F   C O N F I G
    let isDraggedOut = undefined
    let isDragging = false;
    let isMacroContainerPresent = false
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
    let lastX, lastY
    let offsetX, offsetY;
    let isMenuOpen = false
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
                switch (filteredWords[i]) {
                    case "TITLE COLUMN":
                        titleArray.push(filteredWords[i + 1])
                        break;
                    case "CONTENT COLUMN":
                        contentArray.push(filteredWords[i + 1])
                        break;
                    case "KEYWORDS COLUMN":
                        keywordArray.push(filteredWords[i + 1])
                        break;
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
    //      function onEditableClick() {
    //
    //        //document.querySelector('[data-test-id="tooltip-requester-name"]')
    //        if (!isPromptBoxActive) {
    //            showDatalistPrompt("Please select macro", macroArray)
    //        }
    //    }
    function returnArticleData() {
        let cutNumber = 0
        const articleData = Array.from(articles)
            .map((article) => {
                const innerHTML = Array.from(article.querySelectorAll("span"))
                let parent = article.closest("div")
                let targetDiv = parent.querySelector(
                    `div[elementtiming="omnilog/${currentTicketNr}"]`,
                )
                const paragraphs = article.querySelectorAll(".zd-comment") //:not(blockquote):not(tr)
                const elements = Array.from(
                    document.querySelectorAll('[data-test-id="tooltip-requester-name"]'),
                )
                const requesterCheck = elements.some((element) => {
                    return element.textContent === innerHTML[0].textContent
                })
                if (
                    article.querySelector('div[type="end-user"]') !== null &&
                    requesterCheck &&
                    Boolean(targetDiv)
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
                        )
                        .replaceAll(/[\\.,/|\-():0-9"]/g, ''),
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
            parts.forEach((element) => {
                if (element === "") { cutNumber++ } else { cutNumber = 0 }
                index++
                if (cutNumber >= 4) { parts = parts.slice(0, index); return }
            })
            return parts.join(" ")
        }
        const articleDataNoEmpty = articleData.filter((element) => element !== "")
        return articleDataNoEmpty
    }
    async function getResult() {
        try {
            const result = await articleGrabber() // Wait for the result from articleGrabber
            return result // Return the result when it's ready
        } catch (error) {
            console.error(error) // Handle any errors (though in this case, it's unlikely)
        }
    }
    //heavy wip

    function handleSettingsMenu() {
        const settingsWindow = document.createElement("div");
        // Function to calculate luminance of a color
        //       function getLuminance(color) {
        //           // If the color is in hex format (e.g., #056b00)
        //           if (color.startsWith("#")) {
        //               // Remove the hash, and ensure it has 6 characters
        //               color = color.substring(1);
        //               if (color.length === 3) {
        //                   color = color.split("").map(c => c + c).join(""); // e.g., "056" -> "005566"
        //               }

        //               // Convert hex to RGB
        //               const r = parseInt(color.substring(0, 2), 16);
        //               const g = parseInt(color.substring(2, 4), 16);
        //               const b = parseInt(color.substring(4, 6), 16);

        //               return luminanceFormula(r, g, b); // Apply luminance formula
        //           }

        //           // If the color is in RGB format (e.g., rgb(56, 56, 56))
        //           if (color.startsWith("rgb")) {
        //               const rgb = color.match(/\d+/g); // Extract RGB values
        //               const r = parseInt(rgb[0]);
        //               const g = parseInt(rgb[1]);
        //               const b = parseInt(rgb[2]);

        //               return luminanceFormula(r, g, b); // Apply luminance formula
        //           }

        //           // If the color is an unexpected format, return 0 as default luminance
        //           return 0;
        //       }

        //       // Helper function to calculate luminance based on RGB values
        //       function luminanceFormula(r, g, b) {
        //           console.log('aaaaa')
        //           const a = [r, g, b].map(function (v) {
        //               v /= 255;
        //               return (v <= 0.03928) ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        //           });

        //           return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722; // Luminance formula
        //       }


        // Function to adjust font color based on background
        //function adjustFontColor(backgroundColor) {
        //    const luminance = getLuminance(backgroundColor);
        //    console.log("Luminance:", luminance); // Check luminance value
        //    console.log("Font color:", luminance < 0.5 ? "white" : "black"); // Check font color
        //    return luminance < 0.5 ? "white" : "black";
        //}

        if (!isMenuOpen) {
            isMenuOpen = true
            settingsWindow.id = "settings";
            settingsWindow.style.position = "fixed";
            settingsWindow.style.top = '-200px'; // Adjusted for visibility
            settingsWindow.style.left = '60px';
            settingsWindow.style.backgroundColor = settingsColor;
            settingsWindow.style.padding = "10px";
            settingsWindow.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
            settingsWindow.style.zIndex = "9999";
            settingsWindow.style.width = "50vw"; // Adjust if necessary
            settingsWindow.style.maxHeight = "95vh"; // Max height is 80% of the viewport height
            settingsWindow.style.overflowY = "auto"; // Enable scrolling if the content exceeds max-height
            settingsWindow.style.border = "1px solid #ccc";
            settingsWindow.style.position = "relative";
            settingsWindow.style.color = fontColor; // Apply dynamic font color


            // Create the color input row for color settings
            const colorSettings = document.createElement("div");
            colorSettings.style.marginBottom = "20px"; // Space between rows

            function createColorSetting(labelText, settingName, defaultValue) {
                const settingDiv = document.createElement("div");
                settingDiv.style.marginBottom = "10px";

                const label = document.createElement("label");
                label.textContent = labelText;

                const input = document.createElement("input");
                input.type = "color";
                input.value = defaultValue; // Default color value

                input.addEventListener("input", (e) => {
                    GM_setValue(settingName, e.target.value); // Save the new value
                });

                settingDiv.appendChild(label);
                settingDiv.appendChild(input);
                return settingDiv;
            }
            let inputDiv = document.createElement('div')
            let inputTitle = document.createElement('label')
            inputTitle.innerText = 'Button Amount'
            let buttonAmountInput = document.createElement('input')
            buttonAmountInput.type = 'number'
            buttonAmountInput.min = '0'
            buttonAmountInput.max = '100'
            buttonAmountInput.value = GM_getValue('buttonAmount', 6)
            buttonAmountInput.id = 'buttonAmountInput'
            buttonAmountInput.style.width = '40px'
            buttonAmountInput.addEventListener("input", (e) => { GM_setValue('buttonAmount', buttonAmountInput.value) });
            inputDiv.appendChild(inputTitle)
            inputDiv.appendChild(buttonAmountInput)
            // Color settings for background, font, drag bars, etc.
            colorSettings.appendChild(createColorSetting("Background Color:", "backgroundColor", GM_getValue('backgroundColor', "#056b00")));
            colorSettings.appendChild(createColorSetting("Font Color:", "fontColor", GM_getValue('fontColor', "white")));
            colorSettings.appendChild(createColorSetting("Drag Bar Color:", "dragBarColor", GM_getValue('dragBarColor', "#193818")));
            colorSettings.appendChild(createColorSetting("Options Background Color:", "optionsBackgroundColor", GM_getValue('optionsBackgroundColor', "white")));
            colorSettings.appendChild(createColorSetting("Input Background Color:", "inputBackgroundColor", GM_getValue('inputBackgroundColor', "white")));
            colorSettings.appendChild(createColorSetting("Close Button Background Color:", "closeButtonBackgroundColor", GM_getValue('closeButtonBackgroundColor', "red")));
            colorSettings.appendChild(inputDiv);
            settingsWindow.appendChild(colorSettings);

            // Create the title-input and content-input rows for each button
            const buttonSettings = document.createElement("div");
            buttonSettings.style.marginTop = "20px"; // Space before the title-content inputs
            let buttonAmount = GM_getValue('buttonAmount', 6)
            for (let i = 1; i <= buttonAmount; i++) {
                buttonSettings.appendChild(createTitleContentPair(i, GM_getValue(`button${i}Title`, "input title"), GM_getValue(`button${i}Content`, "input contents")));
            }
            function createTitleContentPair(index, title, content) {

                const pairContainer = document.createElement("div");
                pairContainer.id = `pairContainer${index}`
                pairContainer.style.marginBottom = "5px";
                pairContainer.style.marginRight = '5px'
                pairContainer.style.float = 'left'
                pairContainer.classList.add('button-pair'); // Add class for selecting later
                pairContainer.appendChild(createColorSetting(`Button ${index} Background Color:`, `button${index}Color`, GM_getValue(`button${index}Color`, "#056b00")));
                pairContainer.appendChild(createColorSetting(`Button ${index} Font Color:`, `button${index}fontColor`, GM_getValue(`button${index}fontColor`, "black")));

                const titleLabel = document.createElement("label");
                titleLabel.textContent = `Button ${index} Title: `;
                const titleInput = document.createElement("input");
                titleInput.type = "text";
                titleInput.value = title;
                titleInput.classList.add('button-title'); // Add class for selecting later

                const contentLabel = document.createElement("label");
                contentLabel.textContent = `Button ${index} Content: `;
                const contentInput = document.createElement("textarea");
                contentInput.value = content;
                contentInput.classList.add('button-content'); // Add class for selecting later

                titleInput.addEventListener("input", (e) => {
                    GM_setValue(`button${index}Title`, e.target.value); // Save the new title
                });

                contentInput.addEventListener("input", (e) => {
                    GM_setValue(`button${index}Content`, e.target.value); // Save the new content
                });
                pairContainer.appendChild(titleLabel);
                pairContainer.appendChild(titleInput);
                pairContainer.appendChild(contentLabel);
                pairContainer.appendChild(contentInput);
                return pairContainer;
            }


            // Button titles and contents for button1 to button6
            settingsWindow.appendChild(buttonSettings);

            // Append the settings window to the DOM
            document.querySelector('[data-test-id="support_nav"]').appendChild(settingsWindow);

        }
        else { document.getElementById("settings").remove(); isMenuOpen = false }
        //        function resetSettings() {
        //      // Loop through each color setting input and save the value
        //      const colorInputs = document.querySelectorAll("input[type='color']");
        //      colorInputs.forEach(input => {
        //          const settingName = input.id; // Get the ID (matching the setting name)
        //          const colorValue = input.value;
        //          GM_setValue(settingName, colorValue); // Save to GM storage
        //      });

        //      // Loop through each title-input and content-input pair and save the values
        //      const buttonPairs = document.querySelectorAll('.button-pair');
        //      buttonPairs.forEach((pair, index) => {
        //          const titleInput = pair.querySelector('.button-title');
        //          const contentInput = pair.querySelector('.button-content');

        //          const buttonTitle = titleInput.value;
        //          const buttonContent = contentInput.value;

        //          // Save to GM storage with appropriate keys
        //          GM_setValue(`button${index + 1}Title`, buttonTitle);
        //          GM_setValue(`button${index + 1}Content`, buttonContent);
        //      });

        //      alert("Settings saved!");
        //        }

        // Create Save Button
        //const resetButton = document.createElement("button");
        //resetButton.textContent = "Reset Color Settings";
        //resetButton.style.marginTop = "20px";
        //resetButton.addEventListener("click", resetSettings);

        // Add the save button to the settings window
        //settingsWindow.appendChild(resetButton);
    }

    function showDatalistPrompt(message, options) {
        const promptStartX = GM_getValue("promptX", false)
        const promptStartY = GM_getValue("promptY", false)
        const buttonList = GM_getValue("buttonList", undefined)
        macroArray.sort((a, b) => b.relevancePoints - a.relevancePoints)
        let displayList = options
        isPromptBoxActive = true;
        const promptContainer = document.createElement("div");
        promptContainer.id = "macro-prompt";
        promptContainer.style.position = "fixed";
        promptContainer.style.top = "5px";
        if (promptStartY) { promptContainer.style.top = promptStartY }
        promptContainer.style.left = "450px"//"83%";
        if (promptStartX) { promptContainer.style.left = promptStartX }
        //if (promptContainer.style.top == '-500px' && promptContainer.style.left == '-500px') { console.log('amogus2') }
        promptContainer.style.transform = "translateX(-50%)";
        promptContainer.style.backgroundColor = backgroundColor;
        promptContainer.style.padding = "5px 10px";
        promptContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        promptContainer.style.zIndex = "9999";
        promptContainer.style.color = fontColor;
        promptContainer.style.width = "220px";
        promptContainer.style.border = "1px solid #ccc";
        promptContainer.style.position = "relative";
        const sidebar = document.createElement("div");
        const settingsButton = document.createElement("button")
        const userButtonsContainer = document.createElement("div")
        if (!isMacroContainerPresent) {
            isMacroContainerPresent = true
            sidebar.id = 'sidebar'
            sidebar.textContent = "M A C R O S";
            const smallTextContent = document.createElement('div')
            smallTextContent.textContent = 'Drag from the green bar to retrieve the macro box, drag it back here to hide it again'
            smallTextContent.style.position = 'fixed'
            smallTextContent.style.top = '560px'
            smallTextContent.style.fontSize = '10px'
            sidebar.appendChild(smallTextContent)
            //sidebar.style.float = 'left'
            sidebar.style.padding = "2px 10px";
            sidebar.style.fontSize = "26px";
            sidebar.style.backgroundColor = backgroundColor;
            sidebar.style.border = "none";
            sidebar.style.color = fontColor;
            sidebar.style.fontWeight = "bold";
            sidebar.style.cursor = "pointer";
            sidebar.style.position = "fixed";
            sidebar.style.top = "355px";
            sidebar.style.width = "40px";
            sidebar.style.height = '310px'
            sidebar.style.display = 'flex';
            sidebar.style.justifyContent = 'center';
            sidebar.style.textAlign = 'center';
            sidebar.style.zIndex = "999";

            sidebar.addEventListener("mousedown", (e) => {
                const promptBox = document.getElementById('macro-prompt')
                lastX = e.clientX
                lastY = e.clientY
                promptBox.style.top = `${e.clientY}px`
                promptBox.style.left = `${e.clientX}px`
                isDragging = true;
                document.body.style.userSelect = "none"; // Prevent text selection while dragging
            });
            sidebar.addEventListener("mouseup", (e) => {
                isDragging = false
            });
            document.querySelector('[data-test-id="support_nav"]').appendChild(sidebar)
        }
        settingsButton.style.backgroundImage = 'url(https://raw.githubusercontent.com/EEEGuba/Ryanair-Zendesk-Tampermonkey-addons/refs/heads/main/Custom%20synced%20macros/settings%20button%20icon.png)';
        settingsButton.style.backgroundSize = 'cover';
        settingsButton.style.backgroundRepeat = 'repeat-x';
        settingsButton.style.backgroundSize = '40%'
        settingsButton.style.backgroundPosition = 'center';
        settingsButton.style.position = 'fixed'
        settingsButton.style.top = '325px'
        settingsButton.style.height = '30px'
        settingsButton.style.width = '60px'
        settingsButton.style.zIndex = "999";
        settingsButton.addEventListener("mousedown", (e) => {
            e.stopPropagation(); // Prevent this event from bubbling up to the sidebar
            handleSettingsMenu();
        })
        userButtonsContainer.style.backgroundColor = "rgba(255, 0, 0, 0)"
        //userButtonsContainer.style.backgroundSize = 'cover';
        //userButtonsContainer.style.backgroundRepeat = 'repeat-x';
        //userButtonsContainer.style.backgroundSize = '40%'
        //userButtonsContainer.style.backgroundPosition = 'center';
        userButtonsContainer.style.position = 'fixed'
        userButtonsContainer.style.top = '665px'
        userButtonsContainer.style.height = `${window.innerHeight-665}px`
        userButtonsContainer.style.width = '70px'
        userButtonsContainer.style.overflow = 'scroll'
        userButtonsContainer.style.zIndex = "999";
        sidebar.appendChild(settingsButton)
        //document.appendChild(userButtonsContainer)
        document.querySelector('[data-test-id="support_nav"]').appendChild(userButtonsContainer)
        // Define a class for the user button
        userButtonsContainer.addEventListener('click', (e) => {
            // Prevent click event from bubbling up to sidebar
            console.log('User button container clicked!');
        });
        class UserButton {
            constructor(title, content, color, fontColor) {
                this.button = document.createElement("button");
                this.button.textContent = title;
                this.button.style.backgroundColor = color;
                this.button.style.color = fontColor;
                this.content = content;
                this.button.style.float = 'left'
                this.button.style.border = "2px solid #000";
                this.button.style.fontSize = '10px'
                this.button.style.lineHeight = "1";
                this.button.style.marginTop = '2px'; // Adds 2px space below each button
                this.button.style.maxWidth = '60px'
                this.button.width='100%'
                this.button.style.maxHeight = '160px'
                this.button.minHeight = '60px'
            }

            // Method to set an arbitrary click handler
            setClickHandler(callback) {
                this.button.addEventListener("click", (e) => {
                    // Prevent the event from bubbling up to the parent
                    callback(); // Call the passed-in callback function
                });
            }
        }

        // Simulate the GM_setValue data (assuming you have it elsewhere in code)
        //GM_setValue("buttonList", [{ title: "test1 N SHIET, this is a teeest, biiiiiiiib, biiiiiiib", content: "this is test1, you may not like it but I don't either", color: "pink", fontColor: "green" }]);

        function createButtons() {
            for (let i = 1; i <= GM_getValue('buttonAmount',0); i++) {
                const userBtn = new UserButton(GM_getValue(`button${i}Title`,'placeholder title'), GM_getValue(`button${i}Content`, "placeholder contents"), GM_getValue(`button${i}Color`,'green'), GM_getValue(`button${i}fontColor`,'white'));
                // Define an arbitrary function to be called when the button is clicked
                const clickFunction = () => {
                    alert(userBtn.content); // Example: Show the button's content in an alert
                };


                // Set the click handler to the arbitrary function
                userBtn.setClickHandler(clickFunction);

                userButtonsContainer.appendChild(userBtn.button); // Append the button element to the container
            };
        }

        createButtons();

        //       const quickCopyButtonContainer = document.createElement('div')
        //               sidebar.appendChild(quickCopyButtonContainer);

        //        const quickCopyButtonTemplate = document.createElement("div");
        //       quickCopyButtonTemplate.style.padding = "2px 10px";
        //       quickCopyButtonTemplate.style.fontSize = "24px";
        //       quickCopyButtonTemplate.style.backgroundColor = closeButtonBackgroundColor
        //       quickCopyButtonTemplate.style.border = "none";
        //       quickCopyButtonTemplate.style.color = fontColor;
        //       quickCopyButtonTemplate.style.fontWeight = "bold";
        //       quickCopyButtonTemplate.style.cursor = "pointer";
        //    // quickCopyButtonTemplate.style.position = "relative";
        //    // quickCopyButtonTemplate.style.top = "-5px";
        //    // quickCopyButtonTemplate.style.left = "10px";


        //       quickCopyButtonTemplate.textContent = ""
        //       quickCopyButtonTemplate.onclick = function () {
        //       };
        //       sidebar.appendChild(closeButton);

        // Create the left bar
        const leftBar = document.createElement("div");
        leftBar.style.cursor = "move"
        leftBar.style.width = "10px";
        leftBar.style.backgroundColor = dragBarColor;
        leftBar.style.border = "1px solid #ccc";
        leftBar.style.height = "104px";
        leftBar.style.position = "absolute";
        leftBar.style.left = "-12px";
        leftBar.style.top = "-1px";
        leftBar.style.backgroundImage = 'url(https://raw.githubusercontent.com/EEEGuba/Ryanair-Zendesk-Tampermonkey-addons/refs/heads/main/Custom%20synced%20macros/three%20dots.png)';
        leftBar.style.backgroundSize = 'cover';
        leftBar.style.backgroundRepeat = 'no-repeat';
        leftBar.style.backgroundSize = '300%'
        leftBar.style.backgroundPosition = 'center';

        leftBar.addEventListener("mousedown", (e) => {
            isDragging = true;
            lastX = e.clientX
            lastY = e.clientY
            document.body.style.userSelect = "none"; // Prevent text selection while dragging
        });

        // Add the left bar to the promptContainer
        promptContainer.appendChild(leftBar);
        const rightBar = document.createElement("div");
        rightBar.style.cursor = "move"
        rightBar.style.width = "10px";
        rightBar.style.backgroundColor = dragBarColor;
        rightBar.style.border = "1px solid #ccc";
        rightBar.style.height = "104px";
        rightBar.style.position = "absolute";
        rightBar.style.right = "-12px";
        rightBar.style.top = "-1px";
        rightBar.style.backgroundImage = 'url(https://raw.githubusercontent.com/EEEGuba/Ryanair-Zendesk-Tampermonkey-addons/refs/heads/main/Custom%20synced%20macros/three%20dots.png)';
        rightBar.style.backgroundSize = 'cover';
        rightBar.style.backgroundRepeat = 'no-repeat';
        rightBar.style.backgroundSize = '300%'
        rightBar.style.backgroundPosition = 'center';

        rightBar.addEventListener("mousedown", (e) => {
            lastX = e.clientX
            lastY = e.clientY
            isDragging = true;
            document.body.style.userSelect = "none"; // Prevent text selection while dragging
        });

        rightBar.addEventListener("mouseup", () => {
            GM_setValue("promptX", promptContainer.style.left)
            GM_setValue("promptY", promptContainer.style.top)
        })
        leftBar.addEventListener("mouseup", () => {
            GM_setValue("promptX", promptContainer.style.left)
            GM_setValue("promptY", promptContainer.style.top)
        })
        // Add the left bar to the promptContainer
        promptContainer.appendChild(rightBar);

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
        closeButton.style.backgroundColor = closeButtonBackgroundColor
        closeButton.style.border = "none";
        closeButton.style.color = fontColor;
        closeButton.style.fontWeight = "bold";
        closeButton.style.cursor = "pointer";

        closeButton.style.position = "relative";
        closeButton.style.top = "-5px";
        closeButton.style.left = "10px";
        closeButton.onclick = function () {
            createMessageBox("Copying nothing, like you wanted!", 3000)
                ; promptContainer.style.left = '-500px'; promptContainer.style.top = '-500px'; setTimeout(() => {
                    GM_setValue("promptX", promptContainer.style.left)
                    GM_setValue("promptY", promptContainer.style.top)
                }, 100);
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
        datalistContainer.style.backgroundColor = optionsBackgroundColor;
        datalistContainer.style.border = "1px solid #ccc";
        datalistContainer.style.position = "absolute";
        datalistContainer.style.top = "99px";
        datalistContainer.style.width = "218px";
        datalistContainer.style.zIndex = "9999";
        //datalistContainer.style.borderRadius = "4px";
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
                    messageBox.style.right = "10px";
                    if (window.event.clientX > window.innerWidth / 2) { messageBox.style.left = "10px"; }
                    messageBox.style.backgroundColor = backgroundColor;
                    messageBox.style.color = fontColor;
                    messageBox.style.padding = "10px 10px";
                    messageBox.style.borderRadius = "15px";
                    messageBox.style.fontSize = "16px";
                    messageBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
                    messageBox.style.zIndex = "9999";
                    messageBox.style.display = "none";
                    messageBox.style.maxWidth = '45%';
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
        checkboxText.innerText = "search content?   "
        const searchContentCheckbox = document.createElement("input")
        searchContentCheckbox.setAttribute("type", "checkbox");
        checkboxDiv.style.position = "relative";
        checkboxDiv.style.top = "0px";
        checkboxDiv.style.left = "0px";
        checkboxDiv.style.width = "200px"
        searchContentCheckbox.addEventListener('input', search)
        // Create an input field linked to the datalist
        const inputElement = document.createElement("input");
        inputElement.setAttribute("list", "prompt-datalist");
        inputElement.setAttribute("placeholder", "Type here to search");
        inputElement.style.backgroundColor = inputBackgroundColor
        inputElement.style.fontSize = "20px"; // Adjust text size
        inputElement.style.padding = "5px"; // Add padding
        inputElement.style.height = "30px"; // Set height
        inputElement.style.width = "210px";
        checkboxDiv.appendChild(checkboxText)
        checkboxDiv.appendChild(searchContentCheckbox)
        promptContainer.appendChild(checkboxDiv)
        inputElement.addEventListener('input', search)


        //WIP
        //TOADD: checkbox for checking content instead of titles
        function search() {
            const searchTerm = inputElement.value.toLowerCase();
            const searchContent = searchContentCheckbox.checked
            displayList.forEach(item => {
                let itemText = undefined;
                if (searchContent) { itemText = item.content.toLowerCase() } else { itemText = item.title.toLowerCase() }
                if (itemText.includes(searchTerm)) {
                    document.getElementById(`option${item.index}`).style.display = 'block';
                } else {
                    document.getElementById(`option${item.index}`).style.display = 'none';
                }
            })
        }
        promptContainer.appendChild(inputElement);

        document.body.appendChild(promptContainer);

        function select(option, returnNotCopy = false) {
            //     isPromptBoxActive = false
            promptContainer.style.left = '-500px'; promptContainer.style.top = '-500px'
            let resultOfFunction = undefined
            const userInput = option.title
                .replace(/%5cn/g, "\n")
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
            //    document.body.removeChild(promptContainer)
            //     document.body.removeChild(datalist)
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
            //onEditableClick()
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
                    backgroundColor
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
                    backgroundColor
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
        messageBox.style.backgroundColor = backgroundColor
        messageBox.style.color = fontColor
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

    function calculateRelevance() { //W I P
        const returnedArticleData = returnArticleData()
        const tree = buildTree(returnedArticleData)
        for (let i = 0; i < titleArray.length; i++) {
            if (titleArray[i] != "TITLE COLUMN" && titleArray[i] != "KEYWORD COLUMN" && titleArray[i] != "CONTENT COLUMN") {
                const keywordArr = keywordArray[i].replaceAll(" ", "").split(",")
                let relevance = 0
                keywordArr.forEach((keyword) => {
                    const weight = Number.parseInt(keyword.charAt(1))
                    if (isNaN(weight) || weight == 0) { return }
                    const word = keyword.substring(3)
                    relevance += getWordCount(word) * weight
                })
                const lookup = macroArray.find(e => e.title === titleArray[i])
                if (Boolean(lookup)) { lookup.relevancePoints = relevance } else {
                    macroArray.push(new macro(i, titleArray[i], contentArray[i], relevance))
                }
            }
            function macro(index, title, content, relevancePoints) {
                this.index = index
                this.title = title
                this.content = content
                this.relevancePoints = relevancePoints
            }
        }
        function getWordCount(word) {
            let currentNode = tree;

            for (let i = 0; i < word.length; i++) {
                const letter = word[i];

                // If the letter doesn't exist in the tree at this level, return 0
                if (!currentNode[letter]) {
                    return 0;
                }

                // Move deeper into the tree
                currentNode = currentNode[letter];
            }

            // After traversing the word, check if 'count' exists, indicating the exact word was inserted
            return currentNode.count || 0; // Return the count, or 0 if the word isn't found
        }
        if (isPromptBoxActive) {
            const promptContainer = document.getElementById("macro-prompt")
            GM_setValue("promptX", promptContainer.style.left)
            GM_setValue("promptY", promptContainer.style.top)
            document.body.removeChild(promptContainer)
        }
        showDatalistPrompt("Please select macro", macroArray)
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
                        recentConvoDate = result
                        //createMessageBox(recentConvoDate, 3000)//todelete
                        if (recentConvoDate == undefined) {
                            dateRefresh()
                        }
                        else (calculateRelevance())
                    })
                }, 500)
            }
        }
        function makeSure() {
            count = 8
            dateRefresh()
        }
    }

    function buildTree(words) {
        let tree = {}
        words.forEach(word => {
            let currentNode = tree;
            for (let i = 0; i < word.length; i++) {
                const letter = word[i].toLowerCase();
                // If the letter doesn't exist as a property, create it
                if (currentNode == " ") { return }
                if (!currentNode[letter]) {
                    currentNode[letter] = {};
                }
                // Move deeper into the tree
                currentNode = currentNode[letter];
            }
            // At the end of the word, increase the count or initialize it
            if (!currentNode.count) {
                currentNode.count = 0;
            }
            currentNode.count += 1;
        });
        return tree;
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


    function handleKeyPress(event) {
        if (event.altKey && event.key === 'b') {
            if (isPromptBoxActive) { document.getElementById('macro-prompt').style.left = '150px'; document.getElementById('macro-prompt').style.top = '10px' }
        }
    }
    document.addEventListener('keydown', handleKeyPress);

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            const promptContainer = document.getElementById("macro-prompt")
            promptContainer.style.left = `${parseInt(promptContainer.style.left) - (lastX - e.clientX)}px`;
            lastX = e.clientX
            promptContainer.style.top = `${parseInt(promptContainer.style.top) - (lastY - e.clientY)}px`;
            lastY = e.clientY
        }
    });

    document.addEventListener("mouseup", (e) => {
        const promptContainer = document.getElementById("macro-prompt")
        const targetRect = document.getElementById('sidebar').getBoundingClientRect();
        if (e.clientX >= targetRect.left && e.clientX <= targetRect.right &&
            e.clientY >= targetRect.top && e.clientY <= targetRect.bottom && isDragging) {
            ; promptContainer.style.left = '-500px'; promptContainer.style.top = '-500px'; setTimeout(() => {
                GM_setValue("promptX", promptContainer.style.left)
                GM_setValue("promptY", promptContainer.style.top)
            }, 100);
        }
        isDragging = false;
        document.body.style.userSelect = "auto"; // Restore text selection
    });



}
