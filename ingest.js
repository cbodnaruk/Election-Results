const express = require('express');
const { Client } = require('basic-ftp');
const fs = require('fs/promises');
var AdmZip = require('adm-zip');
var convert = require('xml-js');


const app = express();
const port = 5000;

let currentZip = null; // Variable to store the name of the most recent zip file
let data = null;

// Middleware
app.use(express.json());

updateData(); // Call the function to update data periodically
setInterval(updateData, 180000); // Update data every 3 minutes

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the Election API!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


async function updateData(){
    // Function to update data in the database
    // This function will be called periodically to update the data
    console.log("Updating data...");
    const rawData = await fetchDataFromFTP(); // Fetch data from the FTP server

    if (rawData) {
        console.log("Data fetched successfully. Processing data...");
        let house = rawData.MediaFeed.Results.Election.find(e => e["eml:ElectionIdentifier"]._attributes.Id == "H")
        let senate = rawData.MediaFeed.Results.Election.find(e => e["eml:ElectionIdentifier"]._attributes.Id == "S")
        data = {house: summarise(house,"H"), senate: summarise(senate,"S"),version: Date.now() }
        console.log("Data processed successfully.");
        fs.writeFile(`./data/current.json`, JSON.stringify(data)) // Write the data to a file
    }




}




async function fetchDataFromFTP() {
    let rawData = null; // Variable to store the fetched data
    // Function to fetch data from the FTP server
    // This function will connect to the FTP server and download the data files
    console.log("Fetching data from FTP server...");
    
    const client = new Client()
    client.ftp.verbose = false
    try {
        await client.access({
            host: "mediafeed.aec.gov.au",
            secure: false
        })
        let list = await client.list()
        let electionID = list[0].name
        await client.cd(electionID)
        await client.cd('Detailed')
        await client.cd('Verbose')
        let zips = await client.list()
        let recentZip = zips[zips.length - 1].name
        if (currentZip !== recentZip) {
            currentZip = recentZip; // Update the current zip file name
            console.log("New zip file found: ", recentZip)
            await client.downloadTo(`./zip/${recentZip}`, recentZip) // Download the new zip file
            rawData = readZipFile(`./zip/${recentZip}`) // Process the downloaded zip file	
            rawData = readXML(rawData)
        }
        else {
            console.log("No new zip file found. Current zip file: ", currentZip)
        }

    }
    catch(err) {
        console.log(err)
    }
    client.close()
    console.log("FTP connection closed.")
    return rawData; // Return the fetched data
}

function readZipFile(zipFilePath) {
    var zip = new AdmZip(zipFilePath); // Create a new instance of AdmZip
    var folders = zip.getEntries() // Get the entries in the zip file
    let filename = folders.find(entry => entry.entryName.includes("xml/aec")); // Find the xml folder in the zip file
    var file = zip.getEntry(filename) // Get the first file in the xml folder
    var data = zip.readAsText(file); // Read the file as text
    return data
    
}

function readXML(data) {
    // Function to read the XML data and convert it to JS
    // This function will parse the XML data and convert it to a JS object
var options = {compact: true, ignoreComment: true, spaces: 4};
    var result = convert.xml2js(data, options); // Convert the XML data to an object
    return result; // Return the object
}

function summarise(data,type) {
    if (type == "H"){
        let array = data.House.Contests.Contest.map(contest => new Contest(contest)); // Map the contests to Contest objects
        let object = {version: data._attributes.Updated}; // Create an object with the version and contests
        for (let contest of array) {
            object[contest.shortCode] = contest; // Add the contest to the object using the short code as the key
        }
        return object; // Return the object containing all contests
    } else if (type == "S"){
        return {} // Return an empty object for Senate data
    }
}

class Contest {
    constructor(contest) {
        this.updated = (contest._attributes) ? contest._attributes.Updated ?? "" : ""; // Updated date
        this.contestIdentifier = contest["eml:ContestIdentifier"]._attributes.ID; // Contest identifier
        this.shortCode = contest.PollingDistrictIdentifier._attributes.ShortCode; // District short code
        this.state = contest.PollingDistrictIdentifier.StateIdentifier._attributes.ID; // State
        this.name = contest["eml:ContestIdentifier"]["eml:ContestName"]._text; // Contest name
        this.firstPreferences = new FirstPreferences(contest["FirstPreferences"]); // First preferences object
        this.twoCandidatePreferred =  new TwoCandidatePreferred(contest["TwoCandidatePreferred"]); // Two candidate preferred object
        this.twoPartyPreferred = new TwoPartyPreferred(contest["TwoPartyPreferred"]); // Two party preferred object
        this.pollingPlaces = contest.PollingPlaces.PollingPlace.map(pollingPlace => new PollingPlace(pollingPlace)); // Array of polling places
    }
}

class FirstPreferences {
    constructor(firstPreferences) {
        this.updated = (firstPreferences._attributes) ? firstPreferences._attributes.Updated ?? "" : ""; // Updated date
        this.candidates = firstPreferences["Candidate"].map(candidate => new Candidate(candidate)); // Array of candidates

        if (Array.isArray(firstPreferences.Ghost)) {
        this.ghosts = firstPreferences["Ghost"].map(ghost => new Candidate(ghost,false)); // Array of ghost candidates
        } else if (firstPreferences.Ghost) {
        this.ghosts = [new Candidate(firstPreferences["Ghost"],false)]; // Array of ghost candidates
        } else {
        this.ghosts = []; // Empty array if no ghost candidates
        }
        this.formal = {total: new Votes(firstPreferences["Formal"]["Votes"]), votesByType: (firstPreferences["Formal"]["VotesByType"]) ? new VotesByType(firstPreferences["Formal"]["VotesByType"]) : null} // Formal votes object
        this.informal = {total: new Votes(firstPreferences["Informal"]["Votes"]), votesByType: (firstPreferences["Informal"]["VotesByType"]) ? new VotesByType(firstPreferences["Informal"]["VotesByType"]) : null} // Informal votes object
        this.total = {total: new Votes(firstPreferences["Total"]["Votes"]), votesByType: (firstPreferences["Total"]["VotesByType"]) ? new VotesByType(firstPreferences["Total"]["VotesByType"]) : null} // Total votes object
    }
}

class TwoCandidatePreferred {
    maverick = false; // Flag to indicate if the contest is maverick (not following the expected tcp pair)
    constructor(twoCandidatePreferred) {
        if (twoCandidatePreferred._attributes) {
            this.updated = twoCandidatePreferred._attributes.Updated ?? ""; // Updated date
            this.maverick = (twoCandidatePreferred._attributes.Maverick) 
        }
        this.candidates = (this.maverick) ? null : twoCandidatePreferred["Candidate"].map(candidate => new Candidate(candidate)); // Array of candidates
        
    }
}

class TwoPartyPreferred {
    constructor(twoPartyPreferred) {
        // this.updated = twoPartyPreferred._attributes.Updated ?? ""; // Updated date
        this.labor = new Coalition(twoPartyPreferred.Coalition.find(e => e.CoalitionIdentifier._attributes.ShortCode == "ALP")); // Labor object
        this.coalition = new Coalition(twoPartyPreferred.Coalition.find(e => e.CoalitionIdentifier._attributes.ShortCode == "LNC")); // Coalition object
    }
}




class Candidate {
    full = false; // Flag to indicate if the candidate object is complete
    constructor(candidate, current = true) {
        this.current = current; // Current candidate status
        this.candidateIdentifier = candidate["eml:CandidateIdentifier"]._attributes.ID; // Candidate identifier
        if (candidate["eml:CandidateIdentifier"]["eml:CandidateName"]){
            this.full = true;
            this.name = candidate["eml:CandidateIdentifier"]["eml:CandidateName"]._text; // Candidate name
            this.party = candidate["eml:AffiliationIdentifier"] ? candidate["eml:AffiliationIdentifier"]["eml:RegisteredName"]._text : "Independent"; // Candidate party
            this.partyID = candidate["eml:AffiliationIdentifier"] ? candidate["eml:AffiliationIdentifier"]._attributes.ID : 0; // Candidate party ID
            this.incumbent = candidate["Incumbent"]._text; // Incumbent status
            this.votesByType = new VotesByType(candidate["VotesByType"]); // Votes by type object
        }
        this.totalVotes = new Votes(candidate["Votes"])
        
    }
}

class VotesByType {
    constructor(votesByType) {
        let array = votesByType.Votes.map(votes => new Votes(votes)); // Array of votes by type
        for (let type of array){
            this[type.type] = type; // Add votes by type to the candidate object
        }
    }
}

class Votes {
    constructor(votes) {
        this.total = votes._text;
        this.historic = votes._attributes.Historic;
        this.percentage = votes._attributes.Percentage;
        this.swing = votes._attributes.Swing;
        this.matchedHistoric = votes._attributes.MatchedHistoric;
        this.type = votes._attributes.Type ?? "Total";
}
}

class Coalition {
    constructor(coalition) {
        this.identifier = coalition["CoalitionIdentifier"]._attributes.ID; // Coalition identifier
        this.name = coalition["CoalitionIdentifier"]["CoalitionName"]._text; // Coalition name
        this.shortCode = coalition["CoalitionIdentifier"]._attributes.ShortCode; // Coalition short code
        this.votes = new Votes(coalition["Votes"]); // Votes object
    }
}

class PollingPlace {
    constructor(pollingPlace) {
        this.updated = (pollingPlace._attributes) ? pollingPlace._attributes.Updated ?? "" : ""; // Updated date
        this.pollingPlaceIdentifier = pollingPlace.PollingPlaceIdentifier._attributes.ID; // Polling place identifier
        this.pollingPlaceName = pollingPlace.PollingPlaceIdentifier._attributes.Name; // Polling place name
        this.firstPreferences = new FirstPreferences(pollingPlace["FirstPreferences"]); // First preferences object
        this.twoCandidatePreferred = new TwoCandidatePreferred(pollingPlace["TwoCandidatePreferred"]); // Two candidate preferred object

    }
}