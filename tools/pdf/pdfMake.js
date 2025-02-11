const fs = require('fs');
const PdfPrinter = require('pdfmake');

const fonts = {
    Amiri: {
        normal: './tools/pdf/Amiri-Regular.ttf',
        bold: './tools/pdf/Amiri-Bold.ttf',
    },
};

const printer = new PdfPrinter(fonts);

const pdfMake = () => {
    const docDefinition = {
        direction: 'rtl',
        watermark: { text: 'mrelbeltagy.com', color: 'blue', opacity: 0.2, bold: false, italics: false, }, //fontSize: 20
        info: {
            title: 'awesome Document',
            author: 'john doe',
            subject: 'subject of document',
            keywords: 'keywords for document',
        },
        compress: true,
        // userPassword: '123',
        content: [
            {
                text: '\u200Fاسم الطالب: محمود محمد العوضى',
                style: 'header',
                alignment: 'center',
                direction: 'rtl',

            },
            {
                text: 'تقرير الطالب خلال الفترة من: 20/10/2024 الي : 20/20/2505',
                style: 'subheader',
                alignment: 'right',
            },
            {
                text: 'الامر ولى رقم',
                style: 'subheader',
                alignment: 'right',
            },
            {
                table: {
                    widths: ['*', '*', '*', '*'],
                    headerRows: 2,
                    body: [
                        [
                            { text: 'التاريخ', fillColor: '#CCE5FF', alignment: 'center' },
                            { text: 'الاختبار', fillColor: '#CCE5FF', alignment: 'center' },
                            { text: 'درجة الطالب', fillColor: '#CCE5FF', alignment: 'center' },
                            { text: 'التقدير', fillColor: '#CCE5FF', alignment: 'center' },
                        ],
                        ['2024/12/07', 'اختبار 1', '10', 'ممتاز'],
                        ['2024/12/14', 'اختبار 2', '6.5', 'جيد'],
                    ],
                },
                alignment: 'right',
                style: 'table',
            },
            {
                text: 'توقيع ولي الأمر',
                style: 'footer',
                alignment: 'right',
                margin: [0, 20, 0, 0],
            },
        ],
        defaultStyle: {
            font: 'Amiri',
            fontSize: 12,
            direction: 'rtl'
        },
        styles: {
            header: {
                fontSize: 18,
                bold: true,
            },
            subheader: {
                fontSize: 14,
                bold: true,
            },
            table: {
                margin: [0, 10, 0, 10],
            },
            footer: {
                fontSize: 12,
                bold: true,
            },
        },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(fs.createWriteStream('report.pdf'));
    pdfDoc.end();
    return
}
module.exports = pdfMake