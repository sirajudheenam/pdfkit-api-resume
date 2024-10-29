const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Sample JSON input
const inputData = { /* Place your JSON data here */ };

const createResume = (data) => {
    const doc = new PDFDocument({ size: data.meta.paperSize || 'A4', margin: 50 });
    const outputFilePath = path.join(__dirname, 'resume.pdf');
    doc.pipe(fs.createWriteStream(outputFilePath));

    // Add background color if specified
    if (data.meta.background) {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(data.meta.background).fillColor('black');
    }

    // Add photo
    if (data.header.photoPath && fs.existsSync(data.header.photoPath)) {
        const imageSize = 100;
        doc.image(data.header.photoPath, doc.page.width - imageSize - 40, 40, {
            fit: [imageSize, imageSize],
            align: 'right'
        }).rect(doc.page.width - imageSize - 40, 40, imageSize, imageSize).stroke();
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
    doc.addPage().fontSize(18).fillColor('black').text('Education', { underline: true }).moveDown();
    data.education.forEach(edu => {
        doc.fontSize(14).text(`${edu.university}, ${edu.city}, ${edu.country}`, { bold: true })
            .fontSize(12).text(`${edu.degree} in ${edu.major}`)
            .text(`From: ${edu.from} To: ${edu.to}`)
            .moveDown();
    });

    // Experience Section
    doc.addPage().fontSize(18).fillColor('black').text('Experience', { underline: true }).moveDown();
    data.experience.forEach(exp => {
        doc.fontSize(14).text(`${exp.jobTitle} at ${exp.company}`, { bold: true })
            .fontSize(12).text(`${exp.city}, ${exp.country}`)
            .text(`From: ${exp.from} To: ${exp.to}`).moveDown();

        // List responsibilities
        exp.responsibilities.forEach(responsibility => {
            doc.fontSize(12).text(`• ${responsibility}`, { indent: 20 });
        });
        doc.moveDown();
    });

    // Finalize the document
    doc.end();
    console.log(`PDF generated at ${outputFilePath}`);
};

// Generate the resume
createResume(inputData);