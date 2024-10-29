const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Endpoint to generate PDF resume
app.post('/generate-resume', (req, res) => {
    const data = req.body;

    // Create a new PDF document
    const doc = new PDFDocument({ size: data.meta.paperSize || 'A4', margin: 50 });

    // Set response headers to indicate PDF content and trigger download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${data.header.firstName}_resume.pdf`);

    // Pipe PDF document to response
    doc.pipe(res);

    // Add Background Color if specified
    if (data.meta.background) {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(data.meta.background).fillColor('black');
    }

    // Add photo if specified
    if (data.header.photoPath && fs.existsSync(data.header.photoPath)) {
        const imageSize = 100;
        doc.image(data.header.photoPath, doc.page.width - imageSize - 40, 40, {
            fit: [imageSize, imageSize],
            align: 'right'
        });
        if (data.header.photoBorder === "true") {
            doc.rect(doc.page.width - imageSize - 40, 40, imageSize, imageSize).stroke();
        }
    }

    // Header Information
    doc.fontSize(30).fillColor(data.header.color || 'black').text(`${data.header.firstName} ${data.header.lastName}`, 50, 50);
    doc.fontSize(12).fillColor('black').moveDown()
        .text(`Date of Birth: ${data.header.dateOfBirth}`)
        .text(`Address: ${data.header.address}`)
        .text(`City: ${data.header.city}`)
        .text(`Country: ${data.header.country}`)
        .text(`Phone: ${data.header.phone}`)
        .text(`Email: ${data.header.email}`, { link: `mailto:${data.header.email}`, underline: true })
        .moveDown();

    // Education Section
    // doc.addPage().fontSize(18).fillColor('black').text('Education', { underline: true }).moveDown();
    doc.fontSize(18).fillColor('black').text('Education', { underline: true }).moveDown();
    data.education.forEach(edu => {
        doc.fontSize(14).text(`${edu.university}, ${edu.city}, ${edu.country}`, { bold: true })
            .fontSize(12).text(`${edu.degree} in ${edu.major}`)
            .text(`From: ${edu.from} To: ${edu.to}`, { align: "right" })
            .moveDown();
    });

    // Experience Section
    // doc.addPage().fontSize(18).fillColor('black').text('Experience', { underline: true }).moveDown();
    doc.fontSize(18).fillColor('black').text('Experience', { underline: true }).moveDown();
    data.experience.forEach(exp => {
        doc.fontSize(14).text(`${exp.jobTitle} at ${exp.company}`, { bold: true })
            .fontSize(12).text(`${exp.city}, ${exp.country}`)
            .text(`From: ${exp.from} To: ${exp.to}`, { align: "right" }).moveDown();

        // List responsibilities
        exp.responsibilities.forEach(responsibility => {
            doc.fontSize(12).text(`• ${responsibility}`, { indent: 20 });
        });
        doc.moveDown();
    });

    // Finalize the PDF and end the document stream
    doc.end();
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});