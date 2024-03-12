import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const API_URL = "https://api.coingecko.com/api/v3";
let postData = {};

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
async function getCoinPriceAtDate(coinId, date) {
    const historyData = await axios.get(`${API_URL}/coins/${coinId}/history`, {
      params: {
        date,
      },
    });
    const coinPrice = historyData.data.market_data.current_price.usd;
    return coinPrice;
}
function formatDate(inputDate) {
    const dateParts = inputDate.split("-");
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
}
// FUNCTION TO SHOW DECIMALS ONLY IF THEY EXISTS
function formatCurrency(value) {
    const formattedValue = value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: value % 1 === 0 ? 0 : 2
    });
    return formattedValue;
}

app.get("/", async (req, res) => {
    try {
        const cryptoArray = await getCryptoList();
        if(postData.selectedCoin){
            let selectedCoinActualPrice = cryptoArray.find(crypto => crypto.id === postData.selectedCoin).current_price;
            if (!selectedCoinActualPrice) {
                throw new Error("The selected cryptocurrency is not in the list");        
            }
            const rawActualInvestment = postData.initialCoinsAmount * selectedCoinActualPrice;
            const actualInvestment = formatCurrency(rawActualInvestment);          
            res.render("index.ejs", {cryptoArray : cryptoArray, selectedCoin : postData.selectedCoin, initialInvestment: postData.initialInvestment, investmentDate : postData.investmentDate, initialCoinsAmount : postData.initialCoinsAmount, actualInvestment});
        }else{        
            res.render("index.ejs", {cryptoArray});    
        }
    } catch (error) {
        console.error("Failed to make request:", error.message);
        res.render("index.ejs", {
            error: error.message
        });
    }
});
app.post("/calculate", async (req, res) => {
    // USER REQ DATA
    postData.selectedCoin = req.body.cryptoId;
    const rawInitialInvestment = req.body.amount;
    postData.investmentDate = formatDate(req.body.date);
    try {
        const CoinDatePrice = await getCoinPriceAtDate(postData.selectedCoin, postData.investmentDate);
        // CALCULATIONS
        postData.initialCoinsAmount = rawInitialInvestment / CoinDatePrice;
        // CONVERTING PRICE CONFIG
        const initialInvestmentValue = parseFloat(rawInitialInvestment);
        postData.initialInvestment = formatCurrency(initialInvestmentValue);
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error in the Server");        
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });