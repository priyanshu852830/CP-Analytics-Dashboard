let analyzeBtn =
document.getElementById("analyzeBtn");

let ratingChart;
let topicChart;
let currentRating = 0;

let solvedProblems = new Set();

let weakTopicsList = [];

analyzeBtn.onclick = analyze;

async function analyze(){

    let handle =
    document
    .getElementById("handle")
    .value
    .trim();

    if(handle===""){

        alert("Enter a handle");

        return;
    }

    await Promise.all([
        loadProfile(handle),
        loadRatingGraph(handle),
        loadTopics(handle)
    ]);

    analyzeBtn.disabled = false;
    analyzeBtn.innerText = "Analyze";

}

async function loadProfile(handle){

    let url =
    "https://codeforces.com/api/user.info?handles="
    + handle;

    try{

        let response =
        await fetch(url);

        let data =
        await response.json();

        if(data.status!="OK"){

            alert("Handle not found");

            return;
        }

        showProfile(data.result[0]);

    }

    catch{

        alert("Unable to fetch data");
    }

}

function showProfile(user){

    currentRating =
    user.rating ?? 800;

    document
    .getElementById("profile")
    .innerHTML =

    `
    <div style="text-align:center;">

    <img
    src="${user.titlePhoto}"
    style="
    width:100px;
    height:100px;
    border-radius:50%;
    border:3px solid #2563eb;
    margin-bottom:15px;
    ">

    </div>

    <p><b>Handle :</b> ${user.handle}</p>

    <p><b>Current Rating :</b>
    ${user.rating ?? "Unrated"}</p>

    <p><b>Max Rating :</b>
    ${user.maxRating ?? "-"}</p>

    <p><b>Rank :</b>
    ${user.rank ?? "-"}</p>

    <p><b>Max Rank :</b>
    ${user.maxRank ?? "-"}</p>

    <p><b>Contribution :</b>
    ${user.contribution}</p>

    <p><b>Friend Of :</b>
    ${user.friendOfCount}</p>
    `;

}

async function loadRatingGraph(handle){

    let url =
    "https://codeforces.com/api/user.rating?handle="
    + handle;

    let response =
    await fetch(url);

    let data =
    await response.json();

    if(data.status!="OK")
        return;

    drawGraph(data.result);

    showContestStats(data.result);

}

async function loadTopics(handle){

    let url =
    "https://codeforces.com/api/user.status?handle="
    + handle;

    let response =
    await fetch(url);

    let data =
    await response.json();

    if(data.status!="OK")
        return;

    processTopics(data.result);

}

function drawGraph(history){

    let contests = [];
    let ratings = [];

    for(let i=0;i<history.length;i++){

        contests.push(
        history[i].contestName
        );

        ratings.push(
            history[i].newRating
        );

    }

    let ctx =
    document
    .getElementById("ratingChart");

    if(ratingChart)
        ratingChart.destroy();

    ratingChart =
    new Chart(ctx,{

        type:"line",

        data:{

            labels:contests,

            datasets:[{

                label:"Rating",

                data:ratings,

                borderColor:"#2563eb",

                backgroundColor:
                "rgba(37,99,235,0.15)",

                fill:true,

                tension:0.25

            }]

        },

        options:{

            responsive:true,

            plugins:{

                legend:{
                   display:false
                }

            },

            elements:{

                point:{
                    radius:0
                }

            },

            scales:{

                x:{

                  ticks:{
                  display:false
                  },

                  grid:{
                     display:false
                  }

                },

                y:{
     
                    beginAtZero:false

                }

           }

        }

    });

}

function showContestStats(history){

    let contests = history.length;

    let bestRank = Infinity;

    let worstRank = 0;

    let totalRank = 0;

    let maxGain = -Infinity;

    let maxLoss = Infinity;

    for(let i=0;i<history.length;i++){

        let contest = history[i];

        bestRank =
        Math.min(bestRank, contest.rank);

        worstRank =
        Math.max(worstRank, contest.rank);

        totalRank += contest.rank;

        let diff =
        contest.newRating -
        contest.oldRating;

        maxGain =
        Math.max(maxGain, diff);

        maxLoss =
        Math.min(maxLoss, diff);

    }

    let avgRank =
    (totalRank/contests).toFixed(2);

    document
    .getElementById("contestStats")
    .innerHTML =

    `
    <p><b>Contests :</b> ${contests}</p>

    <p><b>Best Rank :</b> ${bestRank}</p>

    <p><b>Worst Rank :</b> ${worstRank}</p>

    <p><b>Average Rank :</b> ${avgRank}</p>

    <p><b>Highest Gain :</b> +${maxGain}</p>

    <p><b>Highest Loss :</b> ${maxLoss}</p>
    `;

}

function processTopics(submissions){

    let topicCount = {};

    solvedProblems.clear();

    for(let i=0;i<submissions.length;i++){

        let sub = submissions[i];

        if(sub.verdict!="OK")
            continue;

        let id =
        sub.problem.contestId +
        "-" +
        sub.problem.index;

        if(solvedProblems.has(id))
            continue;

        solvedProblems.add(id);

        let tags =
        sub.problem.tags;

        for(let j=0;j<tags.length;j++){

            let tag =
            tags[j];

            if(topicCount[tag]==undefined)
                topicCount[tag]=0;

            topicCount[tag]++;

        }

    }

    drawTopicChart(topicCount);

    showStrongWeak(topicCount);

}

function drawTopicChart(topicCount){

    let entries =
    Object.entries(topicCount);

    entries.sort((a,b)=>b[1]-a[1]);

    let labels =
    entries.map(x=>x[0]);

    let values =
    entries.map(x=>x[1]);

    let ctx =
    document
    .getElementById("topicChart");

    if(topicChart)
        topicChart.destroy();

    topicChart =
    new Chart(ctx,{

        type:"bar",

        data:{

            labels:labels,

            datasets:[{

                data:values,

                backgroundColor:"#2563eb"

            }]

        },

        options:{

            plugins:{

                legend:{
                    display:false
                }

            }

        }

    });

}

function showStrongWeak(topicCount){

    let strong = [];

    weakTopicsList = [];

    let weak = weakTopicsList;

    for(let topic in topicCount){

        if(topicCount[topic]>=25)
            strong.push(topic);

        else if(topicCount[topic]<=10)
            weak.push(topic);

    }

    document
    .getElementById("strongTopics")
    .innerHTML =
    strong.join("<br>");

    document
    .getElementById("weakTopics")
    .innerHTML =
    weak.join("<br>");

    loadRecommendations();
}

async function loadRecommendations(){

    let response =
    await fetch(
        "https://codeforces.com/api/problemset.problems"
    );

    let data =
    await response.json();

    if(data.status!="OK")
        return;

    let problems =
    data.result.problems;

    let ans = [];

    for(let i=0;i<problems.length;i++){

        let p =
        problems[i];

        if(!p.rating)
            continue;

        if(
            Math.abs(
                p.rating-currentRating
            )>300
        )
            continue;

        let id =
        p.contestId+
        "-"+
        p.index;

        if(
            solvedProblems.has(id)
        )
            continue;

        let ok=false;

        for(let tag of p.tags){

            if(
                weakTopicsList.includes(tag)
            ){

                ok=true;

                break;

            }

        }

        if(ok){

            ans.push(p);

        }

        if(ans.length==10)
            break;

    }

    // Fallback if no weak-topic problems found

    if(ans.length==0){

        for(let i=0;i<problems.length;i++){

            let p =
            problems[i];

            if(!p.rating)
                continue;

            if(
                Math.abs(
                    p.rating-currentRating
                )>300
            )
                continue;

            let id =
            p.contestId+
            "-"+
            p.index;

            if(
                solvedProblems.has(id)
            )
                continue;

            ans.push(p);

            if(ans.length==10)
                break;

        }

    }

    showRecommendations(ans);

}

function showRecommendations(ans){

    let html="";

    if(ans.length==0){

        html="No recommendations found.";

    }

    else{

        for(let p of ans){

            html+=`
            <p>

            <a
            href="https://codeforces.com/problemset/problem/${p.contestId}/${p.index}"
            target="_blank">

            ${p.index}. ${p.name}

            </a>

            <br>

            Rating :
            ${p.rating}

            <br>

            Topic :
            ${p.tags[0]}

            </p>

            <hr>
            `;

        }

    }

    document
    .getElementById(
        "recommendations"
    )
    .innerHTML=
    html;

}