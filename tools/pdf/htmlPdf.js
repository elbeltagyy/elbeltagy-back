const pdf = require('html-pdf');
const phantomPath = require('phantomjs').path; // Get the path to the PhantomJS binary

const createPdfFromHtml = async (htmlContent, pdfPath = 'output.pdf') => {
    return new Promise((resolve, reject) => {
        const options = {
            phantomPath: phantomPath, // Set the path to the PhantomJS binary
            format: 'A4',
            orientation: 'portrait',
            border: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm',
            },
            type: 'pdf', // Ensure the output is a PDF
            quality: '100', // Set quality (not always applicable)
        };

        // Create PDF from HTML content
        pdf.create(htmlContent, options).toBuffer((err, buffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(buffer);
            }
        });
    });
};

module.exports = createPdfFromHtml;