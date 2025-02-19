const puppeteer = require('puppeteer');

const puppeteerPdf = async (htmlContent, pdfPath = 'output.pdf') => {

  const browser = await puppeteer.launch({
    headless: 'new', // Use the new headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Linux
  });
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
  await page.emulateMediaType('screen');

  // Save as PDF
  const pdf = await page.pdf({
    // path: pdfPath,
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  // console.log('PDF generated successfully!');
  const pdfBuffer = Buffer.from(pdf)
  return pdfBuffer
}
module.exports = puppeteerPdf