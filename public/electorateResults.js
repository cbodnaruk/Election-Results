import { colours, names } from "./parties.js";

export async function showResults(selection,mapBounds) {
    let data = await fetch(`api/single/${selection}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json(); // Parse the JSON response
        })

    const resultDiv = ResultsView(data)

    const detailedViews = document.createElement("div")
    detailedViews.id = "detailed-views"

    const results = document.getElementById("results");
    results.innerHTML = ""; // Clear the previous results
    results.appendChild(resultDiv); // Append the result div to the body
    results.append(detailedViews)
        initPMap(mapBounds,data)
}

function ResultsView(data) {
    const view = document.createElement("div");
    view.classList.add("results-main")



    view.appendChild(TCP(data))

    const fp = document.createElement("div");
    fp.classList.add("fp")

    let sortedFP = data.firstPreferences.candidates.sort((a, b) => {
        return b.totalVotes.percentage - a.totalVotes.percentage
    })

    for (let candidate of sortedFP) {

        fp.appendChild(FPLine(candidate))

    }

    view.appendChild(fp)

    view.appendChild(PollingPlaceMap(data.pollingPlaces))
    // initPMap()


    return view
}

function TCP(data) {

    const tcp = document.createElement("div");
    tcp.classList.add("tcp")
    if (data.twoCandidatePreferred.maverick == "true") {
        const maverick = document.createElement("div")
        maverick.textContent = `Because it is either unclear who will finish in the top two in ${data.name}, or because the one of the top two was unexpected, no Two Candidate Preferred count is available from the AEC.`
        tcp.appendChild(maverick)
    } else {
        tcp.append(Announcement(data.twoCandidatePreferred))
        let [candidate1, candidate2] = data.twoCandidatePreferred.candidates

        const row1 = document.createElement("div");
        row1.classList.add("tcp-row")

        const details1 = document.createElement("div");
        details1.classList.add("fp-details")
        if (candidate1.incumbent) { details1.classList.add("incumbent") }

        const name1 = document.createElement("div");
        name1.classList.add("fp-name")
        name1.textContent = candidate1.name

        const party1 = document.createElement("div");
        party1.classList.add("fp-party")
        party1.textContent = names[candidate1.partyID] ?? candidate1.party

        details1.append(name1, party1)
        row1.appendChild(details1)

        row1.append(DoubleVoteBar(...data.twoCandidatePreferred.candidates))


        const details2 = document.createElement("div");
        details2.classList.add("fp-details")
        details2.style.textAlign = "right"
        if (candidate2.incumbent) { details2.classList.add("incumbent") }

        const name2 = document.createElement("div");
        name2.classList.add("fp-name")
        name2.textContent = candidate2.name

        const party2 = document.createElement("div");
        party2.classList.add("fp-party")
        party2.textContent = names[candidate2.partyID] ?? candidate2.party

        details2.append(name2, party2)




        row1.appendChild(details2)


        const row2 = document.createElement("div");
        row2.classList.add("tcp-row")

        const nums1 = Numbers(candidate1)
        const nums2 = Numbers(candidate2)
        nums2.style.textAlign = "right"

        row2.append(nums1, nums2)
        row2.style.width = window.innerWidth / 5 + "px"

        tcp.append(row1, row2)
    }
    let updated = new Date(data.updated)
    let timeSince = Date.now() - updated.getTime()
    const updateTime = document.createElement("div")
    updateTime.classList.add("update-time")
    updateTime.textContent = `Updated ${Math.floor(timeSince / 60000 / 60)} hour${(Math.floor(timeSince / 60000 / 60) == 1) ? "" : "s"} ago`
    tcp.appendChild(updateTime)
    return tcp
}

function FPLine(candidate) {
    const line = document.createElement("div");
    line.classList.add("fp-line")

    const details = document.createElement("div");
    details.classList.add("fp-details")
    if (candidate.incumbent) { details.classList.add("incumbent") }

    const name = document.createElement("div");
    name.classList.add("fp-name")
    name.textContent = candidate.name

    const party = document.createElement("div");
    party.classList.add("fp-party")
    party.textContent = names[candidate.partyID] ?? candidate.party

    details.append(name, party)

    const voteBar = VoteBar(candidate)

    const nums = Numbers(candidate)

    line.append(details, voteBar, nums)
    return line
}

function Numbers(candidate) {
    const text = document.createElement("div");

    const rawVotes = document.createElement("div");
    rawVotes.classList.add("fp-raw-votes")
    rawVotes.textContent = `Votes: ${parseInt(candidate.totalVotes.total).toLocaleString()}`

    const swing = document.createElement("div");
    swing.classList.add("fp-swing")
    swing.textContent = `Swing: ${candidate.totalVotes.swing}%`

    text.append(rawVotes, swing)

    const button = document.createElement("div")
    button.textContent = "🯛"
    button.classList.add("fp-button")


    const nums = document.createElement("div");
    nums.classList.add("fp-nums")
    nums.append(text, button)

    nums.addEventListener("click", () => showDetailedVotes(candidate))


    return nums
}

function DoubleVoteBar(candidate1, candidate2) {
    const wrapper = document.createElement("div")
    wrapper.classList.add("vote-bar-wrapper")

    const width = window.innerWidth / 5;
    const height = window.innerHeight / 20;
    const percentage1 = candidate1.totalVotes.percentage;
    const percentage2 = candidate2.totalVotes.percentage;
    const fillColour1 = (colours[candidate1.partyID] ?? colours[0]) + "AA";
    const fillColour2 = (colours[candidate2.partyID] ?? colours[0]) + "AA";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);


    const g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // Background rectangle 1
    const background1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background1.setAttribute("width", width * percentage1 / 100);
    background1.setAttribute("height", height);
    background1.setAttribute("fill", fillColour1);

    // Percentage text 1
    const text1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text1.setAttribute("x", 10);
    text1.setAttribute("y", height / 3 * 2);
    text1.setAttribute("font-size", height / 2);
    text1.setAttribute("font-family", "sans-serif");
    text1.setAttribute("fill", "black");
    text1.textContent = `${percentage1}%`;
    g1.append(background1, text1)


    const g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // Background rectangle 2
    const background2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background2.setAttribute("x", width * percentage1 / 100);
    background2.setAttribute("width", width * percentage2 / 100);
    background2.setAttribute("height", height);
    background2.setAttribute("fill", fillColour2);


    // Percentage text 2
    const text2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text2.setAttribute("x", width - 10);
    text2.setAttribute("y", height / 3 * 2);
    text2.setAttribute("font-size", height / 2);
    text2.setAttribute("font-family", "sans-serif");
    text2.setAttribute("fill", "black");
    text2.setAttribute("text-anchor", "end");
    text2.textContent = `${percentage2}%`;


    g2.append(background2, text2)

    // Border rectangle
    const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    border.setAttribute("width", width);
    border.setAttribute("height", height);
    border.setAttribute("fill", "transparent");
    border.setAttribute("stroke", "black");
    border.setAttribute("stroke-width", 1);
    svg.appendChild(border);

    svg.append(g1, g2)
    wrapper.appendChild(svg)

    return wrapper

}

function VoteBar(candidate) {
    const wrapper = document.createElement("div")
    wrapper.classList.add("vote-bar-wrapper")

    const width = window.innerWidth / 5;
    const height = window.innerHeight / 20;
    const fillColour = (colours[candidate.partyID] ?? colours[0]) + "AA";
    const percentage = candidate.totalVotes.percentage;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    // Background rectangle
    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    background.setAttribute("width", width * percentage / 100);
    background.setAttribute("height", height);
    background.setAttribute("fill", fillColour);
    svg.appendChild(background);

    // Percentage text
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", 10);
    text.setAttribute("y", height / 3 * 2);
    text.setAttribute("font-size", height / 2);
    text.setAttribute("font-family", "sans-serif");
    text.setAttribute("fill", "black");
    text.textContent = `${percentage}%`;
    svg.appendChild(text);

    // Border rectangle
    const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    border.setAttribute("width", width);
    border.setAttribute("height", height);
    border.setAttribute("fill", "transparent");
    border.setAttribute("stroke", "black");
    border.setAttribute("stroke-width", 1);
    svg.appendChild(border);

    wrapper.appendChild(svg)
    return wrapper
}

function showDetailedVotes(candidate) {
    const results = document.getElementById("detailed-views")

    const wrapper = document.createElement("div")
    wrapper.classList.add("detailed-votes-wrapper")

    const close = document.createElement("div")
    close.classList.add("detailed-votes-close")
    close.textContent = "⨯"
    wrapper.appendChild(close)

    close.addEventListener("click", (e) => {
        wrapper.style.transform = "translateX(-110%)"
        if (results.childNodes.length == 1) results.style.minWidth = "0"
        setTimeout(() => {
            wrapper.remove()
        }, 300)
    })

    const title = document.createElement("div")
    title.classList.add("detailed-votes-title")
    title.textContent = candidate.name

    const content = document.createElement("div")
    content.classList.add("detailed-votes-content")


    for (let [key, val] of Object.entries(candidate.votesByType)) {
        const row = document.createElement("div")
        row.classList.add("detailed-votes-row")

        const label = document.createElement("div")
        label.classList.add("detailed-votes-label")
        label.textContent = key

        const value = document.createElement("div")
        value.classList.add("detailed-votes-value")
        value.textContent = `${val.percentage}% (${parseInt(val.total).toLocaleString()})`

        row.append(label, value)

        content.appendChild(row)
    }

    wrapper.append(title, content)


    results.append(wrapper)
    wrapper.style.transform = "translateX(0%)"
    results.style.minWidth = "30vw"

}
function Announcement(data) {
    let sortedCandidates = data.candidates.sort((a, b) => {
        return b.totalVotes.percentage - a.totalVotes.percentage
    })
    let winner = sortedCandidates[0]
    let margin = parseInt(sortedCandidates[0].totalVotes.total) - parseInt(sortedCandidates[1].totalVotes.total)
    let marginPercentage = parseFloat(sortedCandidates[0].totalVotes.percentage) - parseFloat(sortedCandidates[1].totalVotes.percentage)
    const announcement = document.createElement("div")
    announcement.classList.add("tcp-announcement")
    let callWord = (marginPercentage > 2) ? "wins" : "leading"
    announcement.textContent = `${names[winner.partyID]} ${callWord} by ${(margin < 3000) ? margin.toLocaleString() + " votes" : marginPercentage.toPrecision(4) / 2 + "%"}.`
    let bgColor = colours[winner.partyID] + ((marginPercentage > 2) ? "AA" : "44")
    announcement.style.backgroundColor = bgColor

    return announcement
}

function PollingPlaceMap(places) {
    const wrapper = document.createElement("div")
    wrapper.classList.add("polling-place-map-wrapper")

    const mapdiv = document.createElement("div")
    mapdiv.id = "pmap"
    wrapper.appendChild(mapdiv)


    return wrapper
}

function initPMap(mapBounds,data) {
    let places = data.pollingPlaces
    let pmap = L.map('pmap')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(pmap);
    pmap.fitBounds(mapBounds)


    for (let place of places){
        if (place.lat){
        let candidates = place.twoCandidatePreferred.candidates.sort((a,b)=>{
            return b.totalVotes.percentage - a.totalVotes.percentage
        })
        for (let c of candidates){
            c.partyID = data.twoCandidatePreferred.candidates.find((x)=>x.candidateIdentifier == c.candidateIdentifier).partyID
        }
        let winnerColour = colours[candidates[0].partyID]
        let radius = (((parseFloat(candidates[0].totalVotes.percentage)) - parseFloat(candidates[1].totalVotes.percentage))*3) + 100
        L.circle([place.lat, place.long],{radius:radius,color:winnerColour,fill:true, fillOpacity:0.7}).addTo(pmap).bindPopup(`${place.name}: ${names[candidates[0].partyID]}: ${parseInt(candidates[0].totalVotes.total).toLocaleString()}. ${names[candidates[1].partyID]}: ${parseInt(candidates[1].totalVotes.total).toLocaleString()}`)
    }}




}