const baseUrl = 'https://aws-us-east-2.unbounded.cloud/databases/pink/';
const headers = {
    'Authorization': 'Basic ' + btoa('johanneskasimir@gmail.com:vaCjJa2qSVWZD65'),
    'Content-Type': 'application/json'
}

export const DATASTORE = {};
async function get() {
    const response = await fetch(
        baseUrl + 'match?type=person',
        {
            headers: headers
        }
    );
    console.log(response);
    const data = await response.json();
    console.log(data.results);
    DATASTORE.people = {};
    data.results.forEach(p => DATASTORE.people[p.name] = p);
}
setInterval(get, 10000);

export async function update_score(name, score) {
    const response = await fetch(
        baseUrl + 'update',
        {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                    match: {type: "person", name: name},
                    set: `o => {o.score += ${score}; return o}`
            })
        }
    );
    console.log(response);
    const data = await response.json();
    console.log(data);
}
setInterval(() => update_score('johannes', 2*Math.random()-1), 10000);
