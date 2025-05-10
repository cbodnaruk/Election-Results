import { loadPage } from "./loadPage.js"; // Import the loadPage function

console.log("app.js loaded");

document.body.appendChild(await loadPage()); // Append the loaded page to the document body