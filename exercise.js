const PDFDocument = require('pdfkit');
const fs = require('fs');

let pdfDoc = new PDFDocument;
pdfDoc.pipe(fs.createWriteStream('SampleDocument.pdf'));
pdfDoc.text("My Sample PDF Document");
pdfDoc.text("From Mon-Sat we will have a 10% discount on selected items!", 20, 150);
pdfDoc
    .fillColor('red')
    .fontSize(17)
    .text("20%", 175, 150);

pdfDoc.text("very long text ".repeat(20), { lineBreak: true });

pdfDoc.addPage();

pdfDoc.text("This text is left aligned", { align: 'left' });
pdfDoc.text("This text is at the center", { align: 'center' });
pdfDoc.text("This text is right aligned", { align: 'right' });
pdfDoc.text("This text needs to be slightly longer so that we can see that justification actually works as intended", { align: 'justify' });


pdfDoc.addPage();

pdfDoc
    .fillColor('blue')
    .text("This is a link", { link: 'https://pdfkit.org/docs/guide.pdf', underline: true });
pdfDoc
    .fillColor('black')
    .text("This text is underlined", { underline: true });
pdfDoc.text("This text is italicized", { oblique: true });
pdfDoc.text("This text is striked-through", { strike: true });


pdfDoc.addPage();

pdfDoc
    .fillColor('blue')
    .text("This text is blue and italicized", { oblique: true, lineBreak: false })
    .fillColor('red')
    .text(" This text is red");

pdfDoc.addPage();

let myArrayOfItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];

pdfDoc.list(myArrayOfItems);
// Move down a bit to provide space between lists
pdfDoc.moveDown(0.5);

let innerList = ['Nested Item 1', 'Nested Item 2'];
let nestedArrayOfItems = ['Example of a nested list', innerList];

pdfDoc.list(nestedArrayOfItems);
// pdfDoc.addPage();

pdfDoc.font('ZapfDingbats').text('This is a symbolic font. \n');
// pdfDoc.addPage();
pdfDoc.font('Times-Roman').fontSize(25).fillColor('blue').text('You can set a color for any font');
// pdfDoc.moveDown(2.5);
// pdfDoc.addPage();
pdfDoc.font('Courier').fontSize(35).fillColor('black').text('Some text to demonstrate.\n');

pdfDoc.font('Monaco').fontSize(25).fillColor('black').text('This is Monoco Font.\n');


pdfDoc.text('By default, the image is loaded in its full size:');
pdfDoc.image('raspberries.jpg');

pdfDoc.addPage();

pdfDoc.moveDown(0.5);
pdfDoc.text('Scaled to fit width and height');
pdfDoc.image('raspberries.jpg', { width: 150, height: 150 });

pdfDoc.addPage();

pdfDoc.moveDown(0.5);
pdfDoc.text('Scaled to fit width');
pdfDoc.image('raspberries.jpg', { width: 150 });

pdfDoc.end();