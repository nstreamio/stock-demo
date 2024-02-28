# Stocks Demo UI, NStream UI Version

This UI displays a real-time table of the current price and daily movement of all stocks in the S&P 500. A single downlink is opened to the `symbols` lane of the `TwelveDataApiAgent` hosted at the application run from this project's `/server` directory. This downlink syncs with the lane's state containing pricing for all 500 stock symbols and then receives follow-on price updates until the downlink is closed. With each update received, local state and UI table content is updated.

This directory contains an alternative UI which was built with NStream's UI framework. With the exception of search, it is functionally the same as the UI contained in the `/ui` directory. The source of the financial streaming data is [TwelveData](https://twelvedata.com/).

## Setup

Install build dependencies:

```sh
$ npm install
```

Compile TypeScript sources

```sh
$ npm run compile
```

Bundle generated JavaScript

```sh
$ npm run bundle
```

Or, to compile and bundle at the same time just run:

```sh
$ npm run build
```

## Running the app

To run the app as a whole, first install dependencies and then execute the following command from the application's UI directory, replacing the TOKEN variable with your own token to TwelveData.

```bash
TOKEN=asdfaerraxcsasdfa npm run dev
```

This command compiles the source code, creates a JS bundle, copies it all to a folder within the `/server` directory before finally starting the Java Swim application. Since it does start the application in `/server`, make sure you're not already running the app before executing this command. Starting the backend also launches a web server which hosts the UI. Go to `localhost:9001` in your browser to view the UI.
