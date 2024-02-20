# Nstream Stock Demo

A tutorial application for teaching core Swim concepts.  See a hosted version
of this app running at [https://stocks.nstream-demo.io](https://stocks.nstream-demo.io/).

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

## Streaming APIs

The [swim-cli](https://www.swimos.org/backend/cli/) is the simplest way to fetch or stream data from  the web agents in this application

### "swim-cli" installation
**swim-cli** installation details available here: https://www.swimos.org/backend/cli/

### Application APIs
**Note:**
* Below **swim-cli** commands for introspection are for streaming locally running application.
* There is a hosted version of this application running here: https://stocks.nstream-demo.io/
* To stream APIs for the hosted version, replace `warp://localhost:9001` in below commands with `warps://stocks.nstream-demo.io`

(Below, Stock ticker symbol "AAPL" is used as an example)

1. **SYMBOLS**:

* List of various stocks' current price, trading volume, bid/ask if any, and the price movement in the stock price.
```sh
swim-cli sync -h warp://localhost:9001 -n /symbols -l stocks
```

2. **STOCK**:

* A particular stock's current status details (current price, trading volume, bid/ask if any, and the price movement in the stock price)
```sh
swim-cli sync -h warp://localhost:9001 -n /stock/AAPL -l status
```

* A particular stock's previous close price details
```sh
swim-cli sync -h warp://localhost:9001 -n /stock/AAPL -l previousClose
```

### Introspection APIs
The Swim runtime exposes its internal subsystems as a set of meta web agents.

Use the `swim:meta:host` agent to introspect a running host. Use the `pulse`
lane to stream high level stats:

```sh
swim-cli sync -h warp://localhost:9001 -n swim:meta:host -l pulse
```

The `nodes` lane enumerates all agents running on a host:

```sh
swim-cli sync -h warp://localhost:9001 -n swim:meta:host -l nodes
```

The fragment part of the `nodes` lane URI can contain a URI subpath filter:

```sh
swim-cli sync -h warp://localhost:9001 -n swim:meta:host -l nodes#/
```

#### Node Introspection

You can stream the utilization of an individual web agent:

```sh
swim-cli sync -h warp://localhost:9001 -n swim:meta:node/%2fadapter%2ftwelvedata -l pulse

swim-cli sync -h warp://localhost:9001 -n swim:meta:node/%2fsymbols -l pulse

swim-cli sync -h warp://localhost:9001 -n swim:meta:node/%2fstock%2fAAPL -l pulse
```

And discover its lanes:

```sh
swim-cli sync -h warp://localhost:9001 -n swim:meta:node/%2fadapter%2ftwelvedata -l lanes

swim-cli sync -h warp://localhost:9001 -n swim:meta:node/%2fsymbols -l lanes

swim-cli sync -h warp://localhost:9001 -n swim:meta:node/%2fstock%2fAAPL -l lanes
```

#### Mesh introspectiong

```sh
swim-cli sync -h warp://localhost:9001 -n swim:meta:edge -l meshes
```
