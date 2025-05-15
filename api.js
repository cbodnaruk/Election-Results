const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const { parse } = require('path');
let data = null; // Variable to store the data
let preload = null
let places = null
let lastLoaded = Date.now(); // Variable to store the last loaded time
fs.readFile('./data/preload.json', 'utf8').then((fileData) => {
preload = JSON.parse(fileData);
})
fs.readFile('./data/allPollingPlaces.json', 'utf8').then((fileData) => {
places = JSON.parse(fileData);
})

router.get('/full', (req, res) => {
    // Check if loaded data is recent enough (or if no data is loaded)
    let version = null;
    
    if (!data || (Date.now() - lastLoaded) > 180000) {
        // If data is not loaded or is older than 3 minutes, reload it
        console.log("Data is old or not loaded. Reloading data...");
        fs.readFile(`./data/current.json`, 'utf8').then((fileData) => {
            data = JSON.parse(fileData); // Parse the JSON data from the file
            console.log("Data reloaded successfully.");
            lastLoaded = Date.now(); // Update the last loaded time
            res.send(data); // Send the data as a response
        }).catch((err) => {
            console.error("Error reading data file:", err);
            res.status(500).send("Error reading data file"); // Send an error response
        });
    } else {
        // If data is already loaded and recent, send it directly
        console.log("Data is fresh. Sending cached data...");
        res.send(data); // Send the cached data as a response
    }
});

router.get('/single/:division', (req, res) => {
    const division = req.params.division; // Get the division from the request parameters
    if (!data) {
        return res.status(500).send("Data not loaded yet"); // Send an error response if data is not loaded
    }
    
    let thisDivision = data.house[division.toUpperCase()]
    
    for (let place of thisDivision.pollingPlaces){
        place.lat = places[place.id].lat
        place.long = places[place.id].long
    }

    res.send(thisDivision); // Send the data for the specified division
});

router.get('/e', (req,res)=>{
        if (!data || (Date.now() - lastLoaded) > 180000) {
        // If data is not loaded or is older than 3 minutes, reload it
        console.log("Data is old or not loaded. Reloading data...");
        fs.readFile(`./data/current.json`, 'utf8').then((fileData) => {
            data = JSON.parse(fileData); // Parse the JSON data from the file
            console.log("Data reloaded successfully.");
            lastLoaded = Date.now(); // Update the last loaded time
        }).catch((err) => {
            console.error("Error reading data file:", err);
        });
    }
    for (let [key, value] of Object.entries(preload)){
        for (let [key2, value2] of Object.entries(preload[key])){
            if (data.house[value2.shortCode].twoCandidatePreferred.maverick == "true"){
                value2.leader = "none"
                value2.leadMargin = 0
            } else{

            let sortedCandidates = data.house[value2.shortCode].twoCandidatePreferred.candidates.sort((a, b) => {
                return b.totalVotes.percentage - a.totalVotes.percentage
            })
            let winner = sortedCandidates[0]
            let marginPercentage = parseFloat(sortedCandidates[0].totalVotes.percentage) - parseFloat(sortedCandidates[1].totalVotes.percentage)
            value2.leader = winner.partyID
            value2.leadMargin = marginPercentage
            
        }}
    }

    res.send(preload)

})


module.exports = router;