const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3005;

// Enable CORS for all routes
app.use(cors());

// Alternatively, configure CORS to allow specific origins and methods
// app.use(cors({
//     origin: 'http://localhost:3000', // Replace with your frontend's URL
//     methods: ['GET', 'POST'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

app.post('/generate-resume2', (req, res) => {
    // Extract data from the request body or use default data
    const data = req.body;

    const { meta } = data;
    // Create a new PDF document
    const doc = new PDFDocument({ size: meta.paperSize || 'A4', margin: 50 });

    // Set response headers to indicate PDF content and trigger download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${data.name}_resume.pdf`);

    // Pipe PDF document to response
    doc.pipe(res);

    // Left fill
    // find w and h for rectange based on paper size. doc.rect(0, 0, w, h)
    const w = doc.page.width * 0.35;
    const h = doc.page.height;

    doc.rect(0, 0, w, h).fill('yellow');

    // Styles and layout
    doc.fillColor('#333').fontSize(20).text(data.name, { align: 'center' });
    doc.fontSize(12).fillColor('#666').text(data.title, { align: 'center' });
    doc.moveDown();

    // Profile Section
    doc.fontSize(10).fillColor('#333').text(data.profile, {
        align: 'center',
        lineGap: 4,
    });
    doc.moveDown();

    // Finalize PDF
    doc.end();
});

app.post('/preview', (req, res) => {
    // Extract data from the request body or use default data
    const data = req.body;

    // Create a new PDF document
    const doc = new PDFDocument({ font: 'Courier', size: meta.paperSize || 'A4', margin: 50 });

    // Set response headers to indicate PDF content and trigger download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${data.header.firstName}_resume.pdf`);

    // Pipe PDF document to response
    doc.pipe(res);

    const lorem = "Lorem ipsum dolor sit amet,consectetur adipiscing elit.Etiam in suscipit purus.Vestibulum anteipsum primis in faucibus orci luctuset ultrices posuere cubilia Curae;Vivamus nec hendrerit felis.Morbialiquam facilisis risus eu lacinia.Sedeu leo in turpis fringilla hendrerit.Utnec accumsan nisl.Suspendisserhoncus nisl posuere tortor tempus etdapibus elit porta.Cras leo neque,    elementum a rhoncus ut, vestibulumnon nibh.Phasellus pretium justo;turpis.Etiam vulputate, odio vitaetincidunt ultricies, eros odio dapibus;nisi, ut tincidunt lacus arcu eu elit.Aenean velit erat, vehicula egetlacinia ut, dignissim non tellus.Aliquam nec lacus mi, sedvestibulum nunc.Suspendisse;potenti.Curabitur vitae sem turpis.Vestibulum sed neque eget dolordapibus porttitor at sit amet sem.Fusce a turpis lorem.Vestibulumante ipsum primis in faucibus orciluctus et ultrices posuere cubilia;Curae;Mauris at ante tellus.Vestibulum a metus lectus.Praesenttempor purus a lacus blandit egetgravida ante hendrerit.Cras et eros;metus.Sed commodo malesuada;eros, vitae interdum augue semper;quis.Fusce id magna nunc.Curabitur sollicitudin placerat;semper.Cras et mi neque, adignissim risus.Nulla venenatisporta lacus, vel rhoncus lectustempor vitae.Duis sagittis venenatis rutrum. Curabitur tempor massa…";

    // Generate the PDF content
    doc.fontSize(25).text('Here is some vector graphics...', 100, 80);

    // Vector graphics
    doc.save()
        .moveTo(100, 150)
        .lineTo(100, 250)
        .lineTo(200, 250)
        .fill('#FF3300');
    doc.circle(280, 200, 50).fill('#6600FF');

    // SVG path
    doc.scale(0.6)
        .translate(470, 130)
        .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
        .fill('red', 'even-odd')
        .restore();

    // Justified text
    doc.text('And here is some wrapped text...', 100, 300)
        .font('Times-Roman', 13)
        .moveDown()
        .text(lorem, {
            width: 412,
            align: 'justify',
            indent: 30,
            columns: 2,
            height: 300,
            ellipsis: true
        });

    doc.end();
});