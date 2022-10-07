// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: bolt;
// Tibber-widget
// v1.0.0 - første versjon - Sven-Ove Bjerkan
// v1.0.1 - Lagt til "HOME_NR" som innstilling
// v1.5.0 - Laget medium- og large-størrelse widget (foreløpig som 3 separate script)
// v1.5.1 - Uploaded to GitHub by Daniel Eneström (https://github.com/danielenestrom)

// Find your token by logging in with your Tibber account here:
// https://developer.tibber.com/settings/accesstoken
// NOTE! Your token is private, don't share it with anyone! This is a demo token
const TIBBER_TOKEN = args.widgetParameter  || "5K4MVS-OjfWhK_4yrjOlFe1F6kJXPVf7eQYggo8ebAE"

// In most cases, the HOME_NR should be 0, but if you have several subscriptions (house + cabin eg)
// then you may need to change it to 1 (or 2).
// Try 0 first and if there is an error message, try with 1 (and then 2).
const HOME_NR = 0;

// HTML code for background color (#000000 is black)
const BACKGROUNDCOLOR = "#000000";

// HTML code for text color (#FFFFFF is white)
const TEXTCOLOR = "#FFFFFF";

// When the hourly rate is higher than the day's average rate this color is used (red)
const TEXTCOLOR_HIGH = "#de4035";

// Når prisen denne timen er lavere enn snittprisen i dag, så brukes denne tekstfargen (grønn)
const TEXTCOLOR_LOW = "#35de3b";




// YOU DON'T HAVE TO CHANGE ANYTHING BELOW !
// -----------------------------------------

// GraphQL-spørring
let body = {
  "query": "{ \
    viewer { \
      homes { \
        name:appNickname \
        currentSubscription { \
          priceInfo { \
            current { \
              total \
            } \
            today { \
              total \
            } \
          } \
        } \
        consumption (resolution: HOURLY, last: " + new Date().getHours() + ") { \
          pageInfo { \
            totalConsumption \
            totalCost \
          } \
        } \
        production(resolution: HOURLY, last: " + new Date().getHours() + ") { \
          pageInfo { \
            totalProduction \
            totalProfit \
          } \
        } \
      } \
    } \
  }"
}

let req = new Request("https://api.tibber.com/v1-beta/gql")
req.headers = {
  "Authorization": "Bearer " + TIBBER_TOKEN,
  "Content-Type": "application/json"
}
req.body = JSON.stringify(body)
req.method = "POST";
let json = await req.loadJSON()
let home = json["data"]["viewer"]["homes"][HOME_NR];
// Array with all of the day's hourly prices
let allToday = home["currentSubscription"]["priceInfo"]["today"]

// Loop through all of the day's hourly prices to find min/max/avg
let minPrice = 100000
let maxPrice = 0
let avgPrice = 0
for (var i = 0; i < allToday.length; i++) {
  if (allToday[i].total * 100 < minPrice)
    minPrice = Math.round(allToday[i].total * 100)
  if (allToday[i].total * 100 > maxPrice)
    maxPrice = Math.round(allToday[i].total * 100)
  avgPrice += allToday[i].total
}
avgPrice = avgPrice / allToday.length * 100


// Fetch total usage/cost so far today
let totCost = Math.round(home["consumption"]["pageInfo"]["totalCost"])
let totUsage = Math.round(home["consumption"]["pageInfo"]["totalConsumption"])

// Fetch total product/profit so far today
let totProfit = Math.round(home["production"]["pageInfo"]["totalProfit"])
let totProduction = Math.round(home["production"]["pageInfo"]["totalProduction"])

// Fetch price in kr for the current hour
let price = (home["currentSubscription"]["priceInfo"]["current"]["total"]);

// Recalculate to øre/öre
let priceOre = Math.round(price * 100)

let lastPriceToday = Math.round(allToday[allToday.length - 1].total * 100);

// Fetch the Tibber logo
const TIBBERLOGO = await new Request("https://tibber.imgix.net/zq85bj8o2ot3/6FJ8FvW8CrwUdUu2Uqt2Ns/3cc8696405a42cb33b633d2399969f53/tibber_logo_blue_w1000.png").loadImage()

// Create widget
async function createWidget() {
  // Create new empty ListWidget instance
  let lw = new ListWidget();

  // Set new background color
  lw.backgroundColor = new Color(BACKGROUNDCOLOR);

  // We can't control when the widget fetches a new price,
  // but we try to ask the widget to refresh one minute after the next hour
  var d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(1);
  lw.refreshAfterDate = d;

  let stack2 = lw.addStack()

  // Left column
  let stackV = stack2.addStack();
  stackV.layoutVertically()
  stackV.setPadding(0, 0, 0, 0)

  // Logo
   let imgstack = stackV.addImage(TIBBERLOGO)
  imgstack.imageSize = new Size(50, 15)
  imgstack.leftAlignImage()
  stackV.addSpacer(10)

  let rightNowTxt = stackV.addText("Just nu");
  rightNowTxt.leftAlignText();
  rightNowTxt.font = Font.lightSystemFont(10);
  rightNowTxt.textColor = new Color(TEXTCOLOR);

  // Add current price in left column
  let price = stackV.addText(priceOre + "");
  price.leftAlignText();
  price.font = Font.lightSystemFont(20);
  // Price higher or lower than the daily average defines the color
  if (priceOre < avgPrice)
    price.textColor = new Color(TEXTCOLOR_LOW)
  if (priceOre > avgPrice)
    price.textColor = new Color(TEXTCOLOR_HIGH)

  const priceTxt = stackV.addText("öre/kWh");
  priceTxt.leftAlignText();
  priceTxt.font = Font.lightSystemFont(10);
  priceTxt.textColor = new Color(TEXTCOLOR);

    // Add today's "max | min" hourly price
  let maxmin = stackV.addText(minPrice + " | " + maxPrice)
  maxmin.centerAlignText()
  maxmin.font = Font.lightSystemFont(10);
  maxmin.textColor = new Color(TEXTCOLOR);

    // Add today's "max | min" hourly price
  let row = stackV.addStack();
  let lastToday = row.addText("23:00 :")
  lastToday.font = Font.lightSystemFont(10);
  lastToday.textColor = new Color(TEXTCOLOR);
  let lastTodayPrice = row.addText(lastPriceToday + " ")
  lastTodayPrice.font = Font.lightSystemFont(10);
  lastTodayPrice.textColor = price.textColor;
  let lastTodayCurrency = row.addText("öre")
  lastTodayCurrency.font = Font.lightSystemFont(10);
  lastTodayCurrency.textColor = new Color(TEXTCOLOR);
  
  // Distance between the columns
  //stack2.addSpacer(10)

  // Right column
  let stackH = stack2.addStack();
  stackH.layoutVertically();
  stackH.setPadding(0, 0, 0, 0);
  
  row = stackH.addStack();
  row.addSpacer();
  let homeNameTxt = row.addText(home.name);
  homeNameTxt.rightAlignText();
  homeNameTxt.font = Font.lightSystemFont(10);
  homeNameTxt.textColor = new Color(TEXTCOLOR);
  stackH.addSpacer(12);
  
  row = stackH.addStack();
  row.addSpacer();
  let usageTxt = row.addText("Totalt idag");
  //usageTxt.rightAlignText();
  usageTxt.font = Font.lightSystemFont(10);
  usageTxt.textColor = new Color(TEXTCOLOR);

  row = stackH.addStack();
  row.addSpacer();
  // Add usage so far today in right column
  let usage = row.addText("- " + totCost + " kr");
  usage.rightAlignText();
  usage.font = Font.lightSystemFont(14);
  usage.textColor = new Color(TEXTCOLOR_HIGH);

  row = stackH.addStack();
  row.addSpacer();
  let usage2 = row.addText(totUsage + " kWh");
  usage2.rightAlignText();
  usage2.font = Font.lightSystemFont(12);
  usage2.textColor = new Color(TEXTCOLOR_HIGH);

  row = stackH.addStack();
  row.addSpacer();
  // Add usage so far today in right column
  let profit = row.addText("+ " + totProfit + " kr");
  profit.rightAlignText();
  profit.font = Font.lightSystemFont(14);
  profit.textColor = new Color(TEXTCOLOR_LOW);

  row = stackH.addStack();
  row.addSpacer();
  let productionKwh = row.addText(totProduction + " kWh");
  productionKwh.rightAlignText();
  productionKwh.font = Font.lightSystemFont(12);
  productionKwh.textColor = new Color(TEXTCOLOR_LOW);


  // Distance to bottom text
  lw.addSpacer(10)

  // Add info about when the widget was last refreshed
  d = new Date()
  let hour = d.getHours();

  // Convert to the format HH:mm
  if (hour < 10) hour = "0" + hour;
  let min = d.getMinutes();
  if (min < 10) min = "0" + min;

  let time = lw.addText("Uppdaterat: " + hour + ":" + min);
  time.centerAlignText();
  time.font = Font.lightSystemFont(8);
  time.textColor = new Color(TEXTCOLOR);

  // Return the created widget
  return lw;
}

let widget = await createWidget();

// Check where the script is running
if (config.runsInWidget) {
  // Runs inside a widget so add it to the homescreen widget
  Script.setWidget(widget);
} else {
  // Show the medium widget inside the app
  widget.presentSmall();
}
Script.complete();
