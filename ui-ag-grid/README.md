# Stocks UI with AG Grid

This UI is functionally similar to the one made with SwimUI at `[projectRoot]/ui` with the exception of search, which has been added here. The UI in this folder was bootstrapped with React + TypeScript + Vite and uses `ag-grid-react` for its table component.

Incoming data is still streamed via a downlink to the the backend found at `projectRoot/server`.

## Running a local Swim backend

Replace the following token with your token to [TwelveData](https://twelvedata.com/).

```bash
cd ../server
TOKEN=asdfaerraxcsasdfa mvn clean compile exec:java
```

## Running the UI locally

```bash
npm run dev
```
