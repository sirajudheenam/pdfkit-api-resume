const express = require('express');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const { XMLHttpRequest } = require('xmlhttprequest');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const request = require('request');

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
app.use(bodyParser.json({ limit: '10mb' }));
// Added a limit after encountering an error with large photo uploads
// PayloadTooLargeError: request entity too large
// The limit is set to 10mb, but you can adjust it based on your needs
app.use(express.urlencoded({ limit: '10mb', extended: true }));

function checkAndAddPage(doc, styles) {
    if (doc.y > 700) {
        doc.addPage({ size: styles.paperSize || 'A4', margin: 50 });
        if (styles.colors.background) {
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(styles.colors.background).fillColor(styles.colors.text || 'black');
        }
    }
}

// async function drawPhoto(doc, photo, styles) {
//     // Add customizable photo with border style based on user input
//     let photoSource, photoBuffer;
//     if (photo) {
//         const imageSize = 100; // Width and height of the photo
//         const x = doc.page.width - imageSize - 40; // X position for the photo
//         const y = 40; // Y position for the photo

//         const border = photo?.style?.border || false; // Show border or not
//         const shape = photo?.style?.shape || 'rounded';// Shape of the photo (rounded original or square)
//         const borderColor = photo?.style?.borderColor || '#333'; // Border color
//         const borderRadius = photo?.style?.borderRadius || 15;// Adjust this to control corner rounding

//         let centerX, centerY;
//         if (photo?.data?.url) {
//             console.log("photo.data.url", photo.data.url);
//             let url = photo.data.url;
//             try {
//                 const response = await axios.get(url, {
//                     responseType: "arraybuffer",
//                 });
//                 console.log("response", response);
//                 photoBuffer = Buffer.from(response.data, 'binary');
//                 console.log("photoBuffer:", photoBuffer);
//             } catch (error) {
//                 console.error('Error loading image:', error);
//             }
//         } else if (photo?.data?.base64) {
//             photoSource = photo?.data?.base64;
//             photoBuffer = Buffer.from(photo?.data?.base64, 'base64');
//         } else if (photo?.data?.path && fs.existsSync(photo?.data?.path)) {
//             photoBuffer = photoSource = photo?.data?.path;
//         }

//         if (photoSource) {
//             // Draw a fully rounded photo
//             if (shape === "rounded") {
//                 centerX = x + imageSize / 2;
//                 centerY = y + imageSize / 2;

//                 // Create a circular clipping mask
//                 doc.save();
//                 doc.circle(centerX, centerY, imageSize / 2).clip();

//                 // Draw the image inside the circular mask
//                 doc.image(photoBuffer, x, y, {
//                     width: imageSize,
//                     height: imageSize,
//                 });

//                 doc.restore();

//                 // Draw a circular border if specified
//                 if (border) {
//                     doc.circle(centerX, centerY, imageSize / 2)
//                         .lineWidth(2) // Border thickness
//                         .stroke(borderColor); // Border color
//                 }
//             }
//             // Draw a square photo with rounded corners
//             else if (shape === "square") {
//                 // Create a rectangular clipping mask with rounded corners
//                 doc.save();
//                 doc.roundedRect(x, y, imageSize, imageSize, borderRadius).clip();
//                 // Draw the image inside the rounded rectangle mask
//                 doc.image(photoBuffer, x, y, {
//                     width: imageSize,
//                     height: imageSize,
//                 });
//                 doc.restore();
//                 // Draw a rounded rectangular border if specified
//                 if (border) {
//                     doc.roundedRect(x, y, imageSize, imageSize, borderRadius)
//                         .lineWidth(2) // Border thickness
//                         .stroke(borderColor); // Border color
//                 }
//             }
//         }
//     }
// }

async function drawPhoto(doc, photo, styles) {
    const imageSize = 100; // Width and height of the photo
    const x = doc.page.width - imageSize - 40; // X position for the photo
    const y = 40; // Y position for the photo

    const { border = false, borderColor = '#333', borderRadius = 15, shape = 'rounded' } = photo?.style || {};

    let photoBuffer;

    // Priority: URL -> Base64 -> Local file path
    if (photo) {
        try {
            if (photo?.data?.url) {
                try {
                    const response = await axios.get(photo.data.url, { responseType: 'arraybuffer' });
                    photoBuffer = Buffer.from(response.data); // ArrayBuffer from URL does not need encoding
                    console.log("using url");
                } catch (error) {
                    console.error("Error loading image from URL:", error);
                }
            } else if (photo?.data?.base64) {
                try {
                    // Remove the base64 prefix if it exists (e.g., "data:image/png;base64,")
                    const base64Data = photo.data.base64.replace(/^data:image\/\w+;base64,/, '');
                    photoBuffer = Buffer.from(base64Data, 'base64'); // Specify 'base64' encoding here
                    console.log("using base64");
                } catch (error) {
                    console.error("Error loading base64 image data:", error);
                }
            } else if (photo?.data?.path && fs.existsSync(photo.data.path)) {
                try {
                    photoBuffer = fs.readFileSync(photo.data.path); // No encoding needed for file
                    console.log("using path");
                } catch (error) {
                    console.error("Error reading image from file path:", error);
                }
            }

            if (photoBuffer) {
                const centerX = x + imageSize / 2;
                const centerY = y + imageSize / 2;

                // Shape handling
                if (shape === 'rounded') {
                    // Circular clipping mask
                    doc.save();
                    doc.circle(centerX, centerY, imageSize / 2).clip();
                    doc.image(photoBuffer, x, y, { width: imageSize, height: imageSize });
                    doc.restore();

                    // Circular border
                    if (border) {
                        doc.circle(centerX, centerY, imageSize / 2)
                            .lineWidth(2)
                            .stroke(borderColor);
                    }
                } else if (shape === 'square') {
                    // Square with rounded corners
                    doc.save();
                    doc.roundedRect(x, y, imageSize, imageSize, borderRadius).clip();
                    doc.image(photoBuffer, x, y, { width: imageSize, height: imageSize });
                    doc.restore();

                    // Square border
                    if (border) {
                        doc.roundedRect(x, y, imageSize, imageSize, borderRadius)
                            .lineWidth(2)
                            .stroke(borderColor);
                    }
                }
            } else {
                console.error('No valid photo source found.');
            }
        } catch (error) {
            console.error('Error loading image:', error);
        }
    }
}

// Personal Section
function drawPersonal(doc, personal, styles) {
    doc.fontSize(30).fillColor(personal?.style?.heading?.color || 'black').text(`${personal?.data?.firstName} ${personal?.data?.lastName}`, 50, 50);
    doc.fontSize(12).fillColor(personal?.style?.color || 'black').moveDown()
        .text(`Date of Birth: ${personal?.data.DOB.day}.${personal?.data.DOB.month}.${personal?.data.DOB.year}`)
        .text(`${personal?.data.address}, ${personal?.data.city}, ${personal?.data.postcode}, ${personal?.data.country}`)
        .text(`Phone: ${personal?.data.phone}`)
        .text(`Email: ${personal?.data.email}`, { link: `mailto:${personal?.data.email}`, underline: false })
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
    doc.fontSize(certifications?.style?.heading.fontSize || 14).fillColor(certifications?.style?.heading.color).text('Certifications', { underline: certifications?.style.heading.underline || false }).moveDown(1);
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

    const {
        meta,
        photo,
        personal,
        education,
        experience,
        certifications,
        languages,
        skills,
        styles
    } = data;
    // Create a new PDF document
    const doc = new PDFDocument({ size: meta.paperSize || 'A4', margin: 50 });

    // Add Background Color if specified
    if (styles?.colors?.background) {
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