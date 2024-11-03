const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

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

function checkAndAddPage(doc, styles) {
    if (doc.y > 700) {
        doc.addPage({ size: styles.paperSize || 'A4', margin: 50 });
        if (styles.colors.background) {
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(styles.colors.background).fillColor(styles.colors.text || 'black');
        }
    }
}
function drawPhoto(doc, photo, styles) {

    // Add customizable photo with border style based on user input
    if (photo.data.path && fs.existsSync(photo.data.path)) {
        const imageSize = 100; // Width and height of the photo
        const x = doc.page.width - imageSize - 40; // X position for the photo
        const y = 40; // Y position for the photo
        const { border, shape, borderColor, borderRadius } = photo.style;

        // Draw a fully rounded photo
        if (shape === "rounded") {
            const centerX = x + imageSize / 2;
            const centerY = y + imageSize / 2;

            // Create a circular clipping mask
            doc.save();
            doc.circle(centerX, centerY, imageSize / 2).clip();

            // Draw the image inside the circular mask
            doc.image(photo.data.path, x, y, {
                width: imageSize,
                height: imageSize,
            });

            doc.restore();

            // Draw a circular border if specified
            if (border) {
                doc.circle(centerX, centerY, imageSize / 2)
                    .lineWidth(2) // Border thickness
                    .stroke(borderColor); // Border color
            }
        }
        // Draw a square photo with rounded corners
        else if (shape === "square") {
            // const borderRadius = borderRadius || 15; // Adjust this to control corner rounding

            // Create a rectangular clipping mask with rounded corners
            doc.save();
            doc.roundedRect(x, y, imageSize, imageSize, borderRadius).clip();

            // Draw the image inside the rounded rectangle mask
            doc.image(photo.path, x, y, {
                width: imageSize,
                height: imageSize,
            });

            doc.restore();

            // Draw a rounded rectangular border if specified
            if (border) {
                doc.roundedRect(x, y, imageSize, imageSize, borderRadius)
                    .lineWidth(2) // Border thickness
                    .stroke(borderColor); // Border color
            }
        }
    }
}

// Personal Section
function drawPersonal(doc, personal, styles) {
    doc.fontSize(30).fillColor(personal.style.heading.color || 'black').text(`${personal.data.firstName} ${personal.data.lastName}`, 50, 50);
    doc.fontSize(12).fillColor(personal.style.color || 'black').moveDown()
        .text(`Date of Birth: ${personal.data.DOB.day}.${personal.data.DOB.month}.${personal.data.DOB.year}`)
        .text(`${personal.data.address}, ${personal.data.city}, ${personal.data.postcode}, ${personal.data.country}`)
        .text(`Phone: ${personal.data.phone}`)
        .text(`Email: ${personal.data.email}`, { link: `mailto:${personal.data.email}`, underline: false })
        .moveDown();
}

// Education Section
function drawEducation(doc, education, styles) {
    doc.fontSize(education.style.heading.fontSize || 18).fillColor(education.style.heading.color).text('Education', { underline: education.style.heading.underline || false }).moveDown(1);
    education && education.data.forEach(edu => {
        doc.fontSize(education.style.text.fontSize || 14).fillColor(education.style.text.color).text(`${edu.degree} in ${edu.major}`, { align: "justify", bold: true })
            .fillColor(education.style.subText.color).fontSize(education.style.subText.fontSize || 12).text(`${edu.university}, ${edu.city}, ${edu.country} - ${edu.from} - ${edu.to} `, { bold: true })
            .moveDown();
    });
    doc.moveDown(1);
}

// Experience Section
function drawExperience(doc, experience, styles) {
    checkAndAddPage(doc, styles);
    doc.fontSize(experience.style.heading.fontSize || 18).fillColor(experience.style.heading.color).text('Experience', { underline: experience.style.heading.underline || false }).moveDown(1);
    experience && experience.data.forEach(exp => {
        doc.fontSize(experience.style.text.fontSize || 14).fillColor(experience.style.text.color).text(`${exp.jobTitle} at ${exp.company}`, { bold: true })
            .fillColor(experience.style.subText.color).fontSize(12).text(`${exp.city}, ${exp.country} - ${exp.from} To: ${exp.to}`, { align: "justify" }).moveDown();

        // List responsibilities
        exp.responsibilities.forEach(responsibility => {
            doc.fontSize(12).text(`• ${responsibility}`, { indent: 20 });
        });
        doc.moveDown(2);
    });
}

// Certifications
function drawCertifications(doc, certifications, styles) {
    checkAndAddPage(doc, styles);
    doc.fontSize(certifications?.style.heading.fontSize || 14).fillColor(certifications?.style.heading.color).text('Certifications', { underline: certifications?.style.heading.underline || false }).moveDown(1);
    certifications && certifications.data.forEach((cert) => {
        doc.moveDown(0.5);
        doc.fontSize(certifications.style.text.fontSize || 10).fillColor(certifications.style.text.color || '#555').text(`• ${cert.name} (${cert.short}) - ${cert.year}`);
    });
    doc.moveDown(2);
}

// Skills Section with Progress Bars
function drawSkills(doc, skills, styles) {
    checkAndAddPage(doc, styles);
    doc.fontSize(skills?.style.heading.fontSize || 14).fillColor(skills?.style.heading.color || '#333').text('Skills', { underline: skills?.style.heading.underline || false }).moveDown(1);

    skills?.data && skills?.data?.forEach((skill) => {
        // Draw skill name
        doc.fontSize(10).fillColor('#555').text(skill.name, { continued: false });

        // Calculate the width of the progress bar based on proficiency (assuming max proficiency is 10)
        const maxWidth = 200; // Maximum width of the progress bar
        const barWidth = (parseInt(skill.proficiency, 10) / 10) * maxWidth;

        // Positioning for the bar
        const barX = doc.x + 100; // Adjust as needed for alignment
        const barY = doc.y - 10;

        // Draw the progress bar background (unfilled part)
        doc.rect(barX, barY, maxWidth, 8).fillColor(skills.style.bar.color).fill(); // "#DDD"
        // Draw the filled part of the progress bar
        doc.rect(barX, barY, barWidth, 8).fillColor(skills.style.bar.progressColor).fill(); // "#4A90E2"

        // Move down for the next skill
        doc.moveDown(1.5);
    });
}


function drawLanguages(doc, languages, styles) {
    checkAndAddPage(doc, styles);

    // Default star colors
    const filledColor = languages?.style?.stars?.color || '#FFD700'; // Filled star color (e.g., gold)
    const unfilledColor = '#CCCCCC'; // Unfilled star color (light gray)

    // Function to draw a star at a given position with a specified color
    const drawStar = (doc, x, y, size, color) => {
        doc.fillColor(color)
            .moveTo(x, y)
            .lineTo(x + size * 0.5, y + size)
            .lineTo(x - size * 0.5, y + size * 0.3)
            .lineTo(x + size * 0.5, y + size * 0.3)
            .lineTo(x - size * 0.5, y + size)
            .closePath()
            .fill();
    };

    // Draw the "Languages" heading with custom styles
    doc.fontSize(languages?.style?.heading?.fontSize || 18)
        .fillColor(languages?.style?.heading?.color || '#333')
        .text('Languages', { underline: languages?.style?.heading?.underline || false })
        .moveDown(1);

    languages?.data && languages?.data.forEach((lang) => {
        // Draw the language name
        doc.fontSize(languages?.style?.text?.fontSize || 14)
            .fillColor(languages?.style?.text?.color || '#555')
            .text(lang.name, { continued: false });

        // Calculate starting position for stars
        const startX = doc.x + 100; // Adjust X position if needed
        const starSize = languages?.style?.stars?.size || 8; // Size of each star
        const spacing = languages?.style?.stars?.spaceBetween || 12; // Spacing between stars

        // Draw 5 unfilled (gray) stars first
        for (let i = 0; i < 5; i++) {
            drawStar(doc, startX + i * spacing, (doc.y - starSize / 2) - 8, starSize, unfilledColor);
        }

        // Draw filled stars based on proficiency level
        for (let i = 0; i < parseInt(lang.stars, 10); i++) {
            drawStar(doc, startX + i * spacing, (doc.y - starSize / 2) - 8, starSize, filledColor);
        }

        // Move down for the next language
        doc.moveDown(1.5);
    });
}

// Endpoint to generate PDF resume
app.post('/generate-resume', (req, res) => {
    const data = req.body;

    const { meta, photo, personal, education, experience, certifications, languages, skills, styles } = data;
    // Create a new PDF document
    const doc = new PDFDocument({ size: meta.paperSize || 'A4', margin: 50 });

    // Add Background Color if specified
    if (styles.colors.background) {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(styles.colors.background).fillColor(styles.colors.text || 'black');
    }

    // Set response headers to indicate PDF content and trigger download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${personal.firstName}_resume.pdf`);

    // Pipe PDF document to response
    doc.pipe(res);



    // Photo Section
    drawPhoto(doc, photo, styles);
    // Personal Section
    drawPersonal(doc, personal, styles);
    // Education Section
    drawEducation(doc, education, styles);
    // Experience Section
    drawExperience(doc, experience, styles);
    // Certifications
    drawCertifications(doc, certifications, styles);
    // skills
    drawSkills(doc, skills, styles);
    // Languages 
    drawLanguages(doc, languages, styles);

    // Finalize the PDF and end the document stream
    doc.end();
});


// Start the server in dev mode
if (process.env.NODE_ENV === 'development') {
    console.log('Starting server in development mode...');
    const PORT = process.env.PORT || 3005;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
} else {
    console.log('Starting server in production mode...');
    // Export the app for Firebase Cloud Functions
    module.exports = app;
}