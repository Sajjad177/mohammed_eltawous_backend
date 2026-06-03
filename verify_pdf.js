import { generatePremiumPDF } from './src/utility/pdfGenerator.js';
import { marked } from 'marked';
import fs from 'fs';

async function verify() {
  const dummyMarkdown = `
## Executive Summary
This is a test of the premium PDF generation system.
It should have **bold text**, *italics*, and professional styling.

## Key Findings
- Scenario A: High Growth
- Scenario B: Market Crash
- Scenario C: Regulatory Shift
  `;

  const html = marked.parse(dummyMarkdown);
  // console.log("Markdown parsed to HTML.");

  try {
    const buffer = await generatePremiumPDF(html, {
      companyName: 'Test Corporation'
    });
    console.log(`PDF generated successfully. Buffer length: ${buffer.length}`);
    fs.writeFileSync('/tmp/test_report.pdf', buffer);
    console.log('Test PDF saved to /tmp/test_report.pdf');
    process.exit(0);
  } catch (err) {
    console.error('PDF generation failed:', err);
    process.exit(1);
  }
}

verify();
