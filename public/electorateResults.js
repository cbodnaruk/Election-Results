import { colours, names } from "./parties.js";

export async function showResults(selection) {
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



                const results = document.getElementById("results");
                results.innerHTML = ""; // Clear the previous results
                results.appendChild(resultDiv); // Append the result div to the body
}

function ResultsView(data){
    const view = document.createElement("div");

    const tcp = document.createElement("div");
    tcp.classList.add("tcp")

    view.appendChild(tcp)

    const fp = document.createElement("div");
    fp.classList.add("fp")

    let sortedFP = data.firstPreferences.candidates.sort((a,b) => {
        return b.totalVotes.percentage - a.totalVotes.percentage
    })

    for (let candidate of sortedFP){
        const line = document.createElement("div");
        line.classList.add("fp-line")

        const details = document.createElement("div");
        details.classList.add("fp-details")
        if (candidate.incumbent) {details.classList.add("fp-incumbent")}

        const name = document.createElement("div");
        name.classList.add("fp-name")
        name.textContent = candidate.name

        const party = document.createElement("div");
        party.classList.add("fp-party")
        party.textContent = names[candidate.partyID] ?? candidate.party

        details.append(name,party)

        const voteBar = VoteBar(candidate)
        
        const rawVotes = document.createElement("div");
        rawVotes.classList.add("fp-raw-votes")
        rawVotes.textContent = `Votes: ${parseInt(candidate.totalVotes.total).toLocaleString()}`

        const swing = document.createElement("div");
        swing.classList.add("fp-swing")
        swing.textContent = `Swing: ${candidate.totalVotes.swing}`

        const nums = document.createElement("div");
        nums.classList.add("fp-nums")
        nums.append(rawVotes,swing)

        line.append(details,voteBar,nums)
        fp.appendChild(line)

    }

    view.appendChild(fp)




    return view
}

function VoteBar(candidate){
    const wrapper = document.createElement("div")
    wrapper.classList.add("vote-bar-wrapper")

    const canvas = document.createElement("canvas")
    canvas.width = window.innerWidth/5
    canvas.height = window.innerHeight/20
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = (colours[candidate.partyID] ?? colours[0])+"AA"
    ctx.fillRect(0,0,canvas.width*candidate.totalVotes.percentage/100,canvas.height)

    ctx.font = `${canvas.height/2}px sans-serif`
    ctx.fillStyle = "black"
    ctx.fillText(`${candidate.totalVotes.percentage}%`,10,canvas.height/3*2)
    
    ctx.strokeStyle = "black"
    ctx.lineWidth = 1
    ctx.strokeRect(0,0,canvas.width,canvas.height)

    wrapper.appendChild(canvas)
    return wrapper
}
