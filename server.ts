import { Client } from "pg";
import { config } from "dotenv";
import express, { text } from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/pastes", async (req, res) => {
  const dbres = await client.query('select * from storedpastes ORDER BY time desc');
  let pastes = dbres.rows
  res.status(200).json({
    status: "success",
    data: {
      pastes
    }
  })
});

app.post("/pastes" , async (req,res) => {
  const {textbody, title} = req.body
  if (typeof textbody === "string"){
    const copiedText = textbody
    const textTitle = title
    const queryValues = [copiedText,textTitle]
    const query = "INSERT into storedpastes(paste_text,paste_title) values($1,$2)"
    const newPaste = await client.query(query,queryValues)
    const pasteResult = newPaste.rows
    res.status(201).json({
      status: "success",
      data:{
        message: `Added "${title} : ${textbody}" to pastebin`
      }
    })
  }
  else {
    res.status(400).json({
      status: "fail",
      data: {
        name: "A string value is required",
      },
    });
  }
})

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
