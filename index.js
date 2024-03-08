import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const API_URL = "https://api.coingecko.com/api/v3";
let selectedCoin;
let inicialInvestment;
let investmentDate;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

async function getCryptoList() {
    const listParams = {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        page: 1,
        per_page: 100,
        sparkline: false,
        price_change_percentage: "1h,24h,7d",
        locale: "en",
      },
    };

    try {
        const response = await axios.get(API_URL + "/coins/markets", listParams);
        return response.data;
      } catch (error) {
        console.error("Failed to get crypto list:", error.message);
        throw error;
      }
}

app.get("/", async (req, res) => {
    try {
        const cryptoArray = await getCryptoList();
        // const historyData = await axios.get(API_URL + "/coins/bitcoin/history?date=30-12-2022");
        console.log(selectedCoin);
        res.render("index.ejs", {cryptoArray});
    } catch (error) {
        console.error("Failed to make request:", error.message);
        res.render("index.ejs", {
            error: error.message
        });
    }
});
app.post("/calculate", async (req, res) => {
    console.log(req.body);
    selectedCoin = req.body.cryptoId;
    inicialInvestment = req.body.amount;
    investmentDate = req.body.date;
    res.redirect("/")
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });