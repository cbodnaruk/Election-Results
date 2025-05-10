import { showResults } from "./electorateResults.js";
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
            electorateSelection.appendChild(electorateOption)

            electorateOption.addEventListener("click", async function (event) {
                var inputValue = event.target.id; // Get the shortcode from the id
                console.log("Input value:", inputValue); // Log the value to the console
                if (document.querySelector('.selected-electorate')) {
                    document.querySelector('.selected-electorate').classList.remove('selected-electorate')
                }
                event.target.classList.add('selected-electorate')
                showResults(inputValue)
            })

        }
        wrapper.appendChild(electorateSelection)


    }

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

