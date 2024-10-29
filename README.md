# pdfkit-api-resume

[Doc](https://github.com/foliojs/pdfkit/wiki/How-to-compile-standalone-PDFKit-for-use-in-the-browser)


```bash
npm install browserify brfs iconv-lite uglify-js pdfkit

npx browserify --standalone PDFDocument node_modules/pdfkit/js/pdfkit.js > pdfkit.js

npx browserify --standalone PDFDocument node_modules/pdfkit/js/pdfkit.js | npx uglifyjs -cm > pdfkit.js

```
## How to install and run

```bash
git clone <repo>
pnpm install
pnpm dev
```

nodemon is taking care of development and hot reloading of index.js

`request.json` contains the actual request from which the data is parsed to produce the resume PDF.


