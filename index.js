import XLSX from "xlsx"
import fs from "node:fs"
import express from "express"
import natural from "natural"

const app = express();
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

var riddles = [], tools = []

const PORT = process.env.PORT || 3000;

(async function () {
    riddles = await readData("./files/Ignite_Quest_365_Riddles.xlsx")
    tools = JSON.parse(fs.readFileSync("./files/ms_tools.json", "utf-8"))["tools"]
    app.listen(PORT, () => {
        console.log(`Listening on port: ${PORT}`)
    })
})();

async function readData(excelFileName) {
    try {
        let ws, wb;
        if (fs.existsSync(excelFileName)) {
            wb = await XLSX.readFile(excelFileName)
        } else {
            wb = XLSX.utils.book_new()
        }

        let sheeNames = wb.SheetNames;
        ws = wb.Sheets[sheeNames[0]]

        return XLSX.utils.sheet_to_json(ws)
    } catch (err) {
        console.error(`Error reading data from Excel: ${err.message}`)
        return []
    }
}

app.get("/", (req, res) => {
    res.send({
        success: true,
        message: "Hello World"
    })
})

app.get("/riddles", (req, res) => {
    res.send(riddles)
})

app.get("/riddles/:id", (req, res) => {
    const { id } = req.params
    
    if(id < riddles.length) {
        res.send({
            success: true,
            riddle: riddles[id].Riddle
        })
    } else {
        res.status(400).send({
            success: false,
            error: "Invalid id"
        })
    }
})

app.post("/riddles/:id", async (req, res) => {
    const { id } = req.params
    const { answer } = req.body

    if(id < riddles.length) {
        const riddle = riddles[id]
        const result = natural.JaroWinklerDistance(answer.replace(/\W+/g, "").trim(), riddle.Answer.replace(/\W+/g, "").trim(), {
            ignoreCase: true
        })
        
        if(result >= 0.90) {
            const tool = tools[Math.floor(Math.random() * tools.length)]

            res.send({
                success: true,
                response: `${tool.name}: ${tool.description}`
            })
        } else {
            res.send({
                success: true,
                response: "Oops, that wasn't quite right! Give it another shot and see if you can crack the riddle!"
            })
        }

    } else {
        res.status(400).send({
            success: false,
            error: "Riddle not found"
        })
    }
})