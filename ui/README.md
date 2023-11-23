# Stock Demo UI

## Building

### Setup

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

### Running the app

If you would like to run the app as a whole, execute the following command from the application's home directory, replacing the TOKEN variable with your own token to TwelveData. Then go to localhost:9001 in your browser.

```bash
cd server
TOKEN=asdfaerraxcsasdfa mvn clean compile exec:java
```
