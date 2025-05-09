export function loadPage() {
    var page = document.createElement("div");
    var form = document.createElement("form");

    var input = document.createElement("input");
    input.type = "text";
    input.name = "textbox";
    input.placeholder = "Enter text here";

    var button = document.createElement("button");
    button.type = "submit";
    button.textContent = "Submit";

    form.appendChild(input);
    form.appendChild(button);
    page.appendChild(form);

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent the default form submission

        var inputValue = input.value; // Get the value from the input field
        console.log("Input value:", inputValue); // Log the value to the console
        
        let data = await fetch(`api/single/${inputValue}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok " + response.statusText);
            }
            return response.json(); // Parse the JSON response
        })

        const resultDiv = document.createElement("div");
        for (let candidate of data.twoCandidatePreferred.candidates) {
            const candidateDiv = document.createElement("div");
            candidateDiv.textContent = `${candidate.name} - ${candidate.party}: ${candidate.totalVotes.percentage}%`; // Display each candidate's name and votes
            resultDiv.appendChild(candidateDiv); // Append each candidate's result to the result div
        }
        document.body.appendChild(resultDiv); // Append the result div to the body

        // Optionally, you can clear the input field after submission
        input.value = "";
    })

    return page;
}