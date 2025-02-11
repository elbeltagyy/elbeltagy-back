const PDFDocument = require('pdfkit');
const fs = require('fs');

const createPdf = () => {
    // Create a document
    const doc = new PDFDocument();

    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream('table_output.pdf'));

    // Function to create a table
    function createTable(doc, data) {
        const tableTop = 100;
        const cellPadding = 10;
        const marginLeft = 50;
        const colWidth = (doc.page.width - 2 * marginLeft) / data.headers.length;

        // Draw headers
        data.headers.forEach((header, i) => {
            doc.font('Helvetica-Bold')
                .fontSize(12)
                .text(header, marginLeft + i * colWidth, tableTop, { width: colWidth, align: 'center' });
        });

        // Draw rows
        data.rows.forEach((row, rowIndex) => {
            const rowTop = tableTop + (rowIndex + 1) * 20;

            row.forEach((cell, cellIndex) => {
                doc.font('Helvetica')
                    .fontSize(10)
                    .text(cell, marginLeft + cellIndex * colWidth, rowTop, { width: colWidth, align: 'center' });
            });
        });
    }

    // Define table data
    const tableData = {
        headers: ['التاريخ', 'المبلغ', 'عن شهر', 'حضور الطالب'],
        rows: [
            ['2024/11/23', '10', '8', '1'],
            ['2024/11/30', '10', '7', '2'],
            ['2024/12/07', '10', '0', '3'],
            ['2024/12/14', '10', '6.5', '4'],
            ['2024/12/21', '10', '0', '5'],
            ['2024/12/28', '10', '0', '6'],
            ['2025/01/10', '45', '21', '7'],
            ['2025/01/11', '10', '0', '8'],
            ['2025/01/18', '10', '0', '9']
        ]
    };

    // Add content to the PDF
    doc.fontSize(16).text('تقارير السبت pdf.2', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('مركز سمارت', { align: 'center' });
    doc.moveDown();

    // Create the table
    createTable(doc, tableData);

    // Finalize the PDF and end the stream
    doc.end();
}

module.exports = createPdf