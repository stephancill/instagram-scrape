var argv = require('minimist')(process.argv.slice(2))

const { Chromeless } = require("chromeless")
const fs = require("fs")

var url = ""

if (!fs.existsSync("./scraped-urls")) {
    fs.mkdirSync("./scraped-urls/")
}


// MARK -- Argument parsing
if (argv.tag) {
    url = `https://www.instagram.com/explore/tags/${argv.tag}`
    if (!fs.existsSync("./scraped-urls/tags")) {
        fs.mkdirSync("./scraped-urls/tags")
    }
} else if (argv.user) {
    url = `https://www.instagram.com/${argv.user}`
    if (!fs.existsSync("./scraped-urls/users")) {
        fs.mkdirSync("./scraped-urls/users")
    }
} else if (argv.url) {
    url = argv.url
}

if (url.length === 0) {
    console.error("Please specify a --tag, --user or --url parameter.");
    process.exit()
}

var set = new Set(url.split("/"))
var arr = ["https:", "www.instagram.com", "explore", ""]
arr.map(s => {set.delete(s)})
var fileUrl = Array.from(set).join("/") + ".txt"
if (!set.has("tags")) {
    fileUrl = "users/" + fileUrl
}

const scrollsBeforeSave = 5

// MARK -- Persistence (reading)
var linksSet = new Set()
fs.readFile(`./scraped-urls/${fileUrl}`, 'utf8', (err,data) => {
    if (err) {
        return console.log(err);
    }
    linksSet = new Set(data.split("\n"))
    linksSet.delete("\n")
    linksSet.delete(" ")
})

async function run() {
    const chromeless = new Chromeless()

    // MARK -- Load More

    // Locate 'Load More' buttona and assign element ID
    await chromeless
        .goto(url)
        .evaluate(() => {
            document.querySelectorAll("a").forEach(a => {
                if (a.innerHTML === "Load more") {a.id = "loadMore"; console.log(a);}
            })
        })

    // Check if 'Load More' button was located
    var canLoadMore = await chromeless
        .evaluate(() => document.getElementById("loadMore") != null)

    // Click 'Load More' if found
    if (canLoadMore) {
        await chromeless
            .scrollTo(0, Number.MAX_SAFE_INTEGER)
            .click("#loadMore")
    } else {
        console.log("Could not locate #loadMore")
    }

    // MARK -- Continuous scrolling
    var currentScrollLocation = await chromeless
        .evaluate(() => window.pageYOffset)
    var lastScrollLocation = -1
    var sameLocationCount = 0

    // Scroll indefinitely
    while (sameLocationCount <= 30) {

        lastScrollLocation = currentScrollLocation

        // Scroll `scrollsBeforeSave` times before saving
        for (var i = 0; i < scrollsBeforeSave; i++) {
            await chromeless
                .wait(100)
                .scrollTo(0, Number.MAX_SAFE_INTEGER)
        }

        // MARK -- Extract links
        var links = await chromeless
            .evaluate(() => [].map.call(document.querySelectorAll("img"),a => {
                var src = a.src
                a.src = ""
                return src
            }).join())

        links = links.split(",")
        var newLinks = []
        links.map(l => {
            if (!linksSet.has(l)) {
                newLinks.push(l)
            }
            linksSet.add(l)
        })

        // MARK -- Persistence (writing)
        if (newLinks.length > 0) {
            fs.appendFileSync(`./scraped-urls/${fileUrl}`, newLinks.join("\n") + "\n")
        }

        // Scrolling exit condition
        currentScrollLocation = await chromeless
            .evaluate(() => window.pageYOffset)

        if (currentScrollLocation === lastScrollLocation) {
            sameLocationCount += 1
            console.log(linksSet.size, sameLocationCount/40);
        } else {
            sameLocationCount = 0
        }

        // Max limit exceeded exit condition
        if (linksSet.size >= argv.max) {
            break
        }
    }

    // End chromeless session
    await chromeless.end()

}

run().catch(console.error.bind(console))
