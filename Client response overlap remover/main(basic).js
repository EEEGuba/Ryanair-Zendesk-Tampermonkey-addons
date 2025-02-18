// ==UserScript==
// @name         client respond append fix by Grzegorz Ptaszynski
// @namespace    http://tampermonkey.net/
// @match        https://ryanairsupport.zendesk.com/agent/tickets/*
// @grant        none
// @description
// @author Grzegorz Ptaszynski
// ==/UserScript==
//for message
var count = 0
//catches all <blockquote> html elements and puts them in array, then hides them
 function getAllBlockquotes() {
        const blockquotes = document.getElementsByTagName("blockquote");
        const num = blockquotes.length;
count += num
     for (var i = 0; i < blockquotes.length; i++) {
  var element = blockquotes[i];
  if (element) {

      element.hidden=true
  }}}
//catches all <tr> html elements and puts them in array, then hides them
 function getAllResponseTables() {
        const tables = document.getElementsByTagName("tr");
        const num = tables.length;
     count += num
     for (var i = 0; i < tables.length; i++) {
  var element = tables[i];
  if (element) {

      element.hidden=true
  }}}
//creates the green message box to show amount of deleted stuff
    function createMessageBox(message) {
        const messageBox = document.createElement('div');
        messageBox.id = 'greasemonkey-message';
        messageBox.innerHTML = message;
        messageBox.style.position = 'fixed';
        messageBox.style.top = '20px';
        messageBox.style.left = '50%';
        messageBox.style.transform = 'translateX(-50%)';
        messageBox.style.backgroundColor = '#4CAF50';
        messageBox.style.color = 'white';
        messageBox.style.padding = '10px 20px';
        messageBox.style.borderRadius = '5px';
        messageBox.style.fontSize = '16px';
        messageBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        messageBox.style.zIndex = '9999'; // Ensure it is on top of other content
        messageBox.style.display = 'none'; // Initially hidden

        document.body.appendChild(messageBox);

        setTimeout(() => {
            messageBox.style.display = 'block';
        }, 100); 

        // Hide the message after 3 seconds (you can adjust this)
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 3000); 
    }
    // Shows the custom message
    function showMessage(message) {
        createMessageBox(message);
    }
    // for (var i = 1; i < 31; i++) {setTimeout(()=>{getAllBlockquotes();getAllResponseTables()},i*500)}

//if this lags delete the lines down to...
    function handleKeyPress(event) {
        if (event.altKey && event.key === 'n') {
            getAllBlockquotes()
            getAllResponseTables()
            showMessage(`removed ${count} of annoying objects`);
            count = 0
        }
    }
    document.addEventListener('keydown', handleKeyPress);
    window.addEventListener('beforeunload', function() {
        document.removeEventListener('keydown', handleKeyPress);
    });
//...here
