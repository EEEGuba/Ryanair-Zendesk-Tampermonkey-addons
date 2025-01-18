// ==UserScript==
// @name         Zendesk merge asignee seatbelt by Grzegorz Ptaszynski
// @namespace    http://tampermonkey.net/
// @version      2024-12-28
// @description  macro helper to ease the pasting of templates
// @author       Grzegorz Ptaszynski
// @match        https://ryanairsupport.zendesk.com/agent/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_openInTab
// ==/UserScript==
//Set your exact zendesk name below, inside the parentheses, and test if it works (stops you merging someone elses case, but not yours)
const agentName = 'CSW Grzegorz Ptaszynski'
//dont modify anything below unless you want to go on an adventure
let cooldown = false
function check(){
    const displayCheck = document.getElementById("ticket-merge").style.display
    if(!cooldown){
if(displayCheck!='none'&&findDivByText(agentName)==null){console.log("a");showAlert(`${agentName} NOT ASSIGNED TO CASE`,500,80);
    cooldown = true;setTimeout(() => {cooldown = false}, 15000);}
        function showAlert(message, width, height) {
        // Create the alert div
        const alertDiv = document.createElement('div');
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '50%';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translate(-50%, -85%)';
        alertDiv.style.backgroundColor = '#C72222';
        alertDiv.style.color = 'white';
        alertDiv.style.padding = '20px';
        alertDiv.style.borderRadius = '8px';
        alertDiv.style.textAlign = 'center';
        alertDiv.style.fontSize = '16px';
        alertDiv.style.display = 'none'; // Hidden initially
        alertDiv.style.zIndex = '9999'
        // Set the width and height of the alert div
        alertDiv.style.width = width + 'px';
        alertDiv.style.height = height + 'px';

        // Set the message inside the alert div
        alertDiv.innerText = message;

        // Append the alert div to the body
        document.body.appendChild(alertDiv);

        // Show the alert div
        alertDiv.style.display = 'block';

        // Optionally, hide the alert after a few seconds
        setTimeout(() => {
            alertDiv.style.display = 'none';
            document.body.removeChild(alertDiv);
        }, 3000); // Alert disappears after 3 seconds
    }
}
   }
function findDivByText(targetText) {
    const divs = document.querySelectorAll("div");
    for (let div of divs) {
        if (div.innerText.trim() === targetText) {
            return div;
        }
    }
    return null;
}

document.addEventListener('mousedown', check);
