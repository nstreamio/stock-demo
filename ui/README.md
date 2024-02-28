# Stocks Demo

This UI displays a real-time table of the current price and daily movement of all stocks in the S&P 500. A single mapDownlink is opened to the `symbols` lane of the `TwelveDataApiAgent` hosted at the application run from this project's `/server` directory. This downlink syncs with the lane's state containing pricing for all 500 stock symbols and then receives follow-on price updates until the downlink is closed. With each update received, local state and UI table content is updated.

The UI in this folder was bootstrapped with React + TypeScript + Vite and uses `ag-grid-react` for its table component. The source of the financial streaming data is [TwelveData](https://twelvedata.com/).

## Setup

Install dependencies.

```bash
npm install
```

## Running the Java Swim application

Replace the following token with your token to [TwelveData](https://twelvedata.com/).

```bash
cd ../server
TOKEN=abcdefghijklmnopqrst mvn clean compile exec:java
```

## Start the UI

Build and serve the UI. It can be viewed in your browser at `localhost:5173`.

```bash
npm run dev
```
