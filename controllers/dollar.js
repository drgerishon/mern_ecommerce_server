const Dollar = require("../models/dollar");
const axios = require("axios");
const cheerio = require("cheerio");



const fromXe = async () => {
    console.log('fromXE')
    const url = `https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=KES`
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "Referer": url,
                "Accept-Language": "en-US,en;q=0.8",
                "Accept-Encoding": "gzip, deflate, br"
            }
        });

        const $ = cheerio.load(response.data);
        const rate = $("#__next > div:nth-child(2) > div.fluid-container__BaseFluidContainer-qoidzu-0.gJBOzk > section > div:nth-child(2) > div > main > div > div:nth-child(2) > div:nth-child(1) > div > p").text().trim();
        const [key, value] = rate.split('=');
        return {value: parseFloat(value.trim().replace('USD', '')), url};

    } catch (err) {
        console.error(err);
        return null;
    }
};
const fromExchangeRates = async () => {
    console.log('fromExchangeRates')
    const url = "https://www.exchangerates.org.uk/Kenyan-Shillings-to-Dollars-currency-conversion-page.html"
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "Referer": url,
                "Accept-Language": "en-US,en;q=0.8",
                "Accept-Encoding": "gzip, deflate, br"
            }
        })
        const html = response.data;
        const $ = cheerio.load(html);
        const rate = $(".p_conv30 span#shd2a").text();
        const [key, value] = rate.split('=');
        return {value: parseFloat(value.trim().replace('USD', '')), url}

    } catch (err) {
        console.error(err);
        return null;
    }


};
const fromWise = async () => {
    console.log('fromWise')
    const url = "https://wise.com/gb/currency-converter/kes-to-usd-rate"
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "Referer": url,
                "Accept-Language": "en-US,en;q=0.8",
                "Accept-Encoding": "gzip, deflate, br"

            }
        })
        const html = response.data;
        const $ = cheerio.load(html);
        return {
            value: parseFloat($("#calculator > div.Calculator_ccCalculator___3ZLT > div.text-xs-center.text-lg-left > h3 > span.text-success.d-inline-block").text()),
            url
        }


    } catch (err) {
        console.error(err);
        return null;
    }
};
const fromCurrencyMe = async () => {
    console.log('fromCurrencyMe')
    const url = "https://www.currency.me.uk/convert/kes/usd"
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "Referer": url,
                "Accept-Language": "en-US,en;q=0.8",
                "Accept-Encoding": "gzip, deflate, br"

            }
        })
        const html = response.data;
        const $ = cheerio.load(html);
        const rate = $("#tofrom2a > span.mini.ccyrate > b").text();
        const [key, value] = rate.split('=');
        return {value: parseFloat(value.trim().replace('USD', '')), url}
    } catch (err) {
        console.error(err);
        return null;
    }
};
const fromForbes = async () => {
    console.log('fromForbes')
    const url = "https://www.forbes.com/advisor/money-transfer/currency-converter/usd-kes/"
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "Referer": url,
                "Accept-Language": "en-US,en;q=0.8",
                "Accept-Encoding": "gzip, deflate, br"

            }
        })

        const html = response.data;
        const $ = cheerio.load(html);
        const rate = $("body > div > div.page.article-link-wrapper.inarticle-link-tracking.bg-white > div:nth-child(4) > div.section.section-calculator > div > div > div > div:nth-child(2)").text();
        const [key, value] = rate.split('=');
        return {value: parseFloat(value.trim().replace('USD', '')), url}
    } catch (err) {
        console.error(err);
        return null;
    }
};
const fromBloomberg = async () => {


    console.log('fromBloomberg')
    const url = "https://www.bloomberg.com/quote/USDKES:CUR?leadSource=uverify%20wall"
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "Referer": url,
                "Accept-Language": "en-US,en;q=0.8",
                "Accept-Encoding": "gzip, deflate, br"

            }
        })


        const html = response.data;
        const $ = cheerio.load(html);
        const resp = $("#root > div > div > section > section.quotePageSnapshot > div > div.snapshot__ec6d7607a3.snapshot > section.snapshotOverview__21d98ae302.loading__da388f7220 > section > section > section > div:nth-child(1) > span.priceText__0550103750").text();
        return {value: parseFloat((1 / resp)), url}




    } catch (err) {
        console.error(err);
        return null;
    }
};


const functions = [fromXe, fromExchangeRates, fromWise, fromCurrencyMe, fromForbes, fromBloomberg];



let selectedIndices = [];

const chooseRandomFunction = async () => {
    let randomIndex = Math.floor(Math.random() * functions.length);
    while (selectedIndices.includes(randomIndex)) {
        randomIndex = Math.floor(Math.random() * functions.length);
    }
    selectedIndices.push(randomIndex);
    if (selectedIndices.length === functions.length) {
        selectedIndices = [];
    }
    let randomFunction = functions[randomIndex];
    let result = await randomFunction();
    if (result) {
        let randomValue = await Dollar.findOne({});
        if (!randomValue) {
            randomValue = new Dollar({rate:(Math.round(result.value * 100) / 100).toFixed(4), from: result.url});
        } else {
            randomValue.rate = (result.value).toFixed(4);
            randomValue.from = result.url;

        }
        console.log(`Saving value: ${(result.value).toFixed(4)} from ${result.url}`);
        await randomValue.save();

    } else {
        await chooseRandomFunction();
    }
};

module.exports = {
    chooseRandomFunction,
};
