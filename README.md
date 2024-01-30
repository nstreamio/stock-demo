# Introduction 

This example utilizes a 3rd party data service called [TwelveData](https://twelvedata.com/) to provide
realtime data about the stock market. In order to run this example you will need an api key for [TwelveData](https://twelvedata.com/).

# Running the example

Replace the following token with your token to [TwelveData](https://twelvedata.com/).

```bash
cd server
TOKEN=asdfaerraxcsasdfa mvn clean compile exec:java
```

# Viewing the UI

## Swim UI Framework

We have two versions of a UI available. The first uses Swim's own UI framework, designed specifically to handle streaming data. Start by installing dependencies and building the app.

```bash
cd ui
npm install
npm run build
```

Then open `ui/dist/index.html` in your browser. Make sure you have the local Swim server running already.

## React + AG Grid

The other option is a UI built with more familiar tools, React bootstrapped with Vite and AG Grid for the table component.

```bash
cd ui-ag-grid
npm install
npm run dev
```

Then head to `localhost:5173` to see it in action.
