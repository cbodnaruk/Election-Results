import { showResults } from "./electorateResults.js";
import { colours } from "./parties.js";
var map
export async function loadPage() {

    var page = document.createElement("div");
    page.id = "wrapper"



    let preload = await fetch('api/e', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    }).then(response => { return response.json() }
    )
    const selectionGrid = SelectionGrid(preload)
    page.append(selectionGrid)



    const results = document.createElement("div");
    results.id = "results"
    page.append(results)



    return page;
}

function SelectionGrid(electorates) {
    let states = []
    const wrapper = document.createElement("div")
    wrapper.classList.add("electorate-selection-wrapper")
    const select = document.createElement("select")
    select.id = "state-select"
    for (const [key, value] of Object.entries(electorates)) {
        states.push(key)
    }
    wrapper.appendChild(select)
    select.append(document.createElement("option"))
    for (let state of states) {
        const option = document.createElement("option")
        option.value = state
        option.text = state
        select.appendChild(option)

        const electorateSelection = document.createElement("div")
        electorateSelection.classList.add('electorate-selection')
        electorateSelection.id = `${state}-electorate-selection`
        for (const [key, value] of Object.entries(electorates[state])) {
            const electorateOption = document.createElement("div")
            electorateOption.classList.add('electorate-option')
            electorateOption.id = key
            electorateOption.textContent = value.name

            electorateOption.style.backgroundColor = colours[value.leader] + ((value.leadMargin > 2) ? "AA" : "44")

            electorateSelection.appendChild(electorateOption)

            electorateOption.addEventListener("click", async function (event) {
                var inputValue = event.target.id; // Get the shortcode from the id
                console.log("Input value:", inputValue); // Log the value to the console
                if (document.querySelector('.selected-electorate')) {
                    document.querySelector('.selected-electorate').classList.remove('selected-electorate')
                }
                event.target.classList.add('selected-electorate')
                                if (map) map.remove()
                let mapBounds = showMap(event.target.textContent).then((bounds)=> {
            showResults(inputValue,bounds)
            })
                // showResults(inputValue,mapBounds)

                
            })

        }
        wrapper.appendChild(electorateSelection)


    }
    const mapbox = document.createElement("div")
    mapbox.id = "map"
    wrapper.appendChild(mapbox)

    select.addEventListener("change", function (event) {
        const selectedState = event.target.value;
        const box = document.getElementById(`${selectedState}-electorate-selection`)
        if (document.querySelector('.selected-state')) {
            document.querySelector('.selected-state').classList.remove('selected-state')
        }
        box.classList.add('selected-state')
    })



    return wrapper
}

async function showMap(elec){
    elec = elec[0] + elec.substring(1).toLowerCase()
    let elecjson = await fetch(`./geojsons/${elec}.geojson`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
})
    let data = await elecjson.json()
    console.log(data);
    
    map = L.map('map')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
    let geoJSON = L.geoJSON(data).addTo(map);
    map.fitBounds(geoJSON.getBounds());
    return geoJSON.getBounds()
}
