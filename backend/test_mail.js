const nodemailer = require('nodemailer');

async function test(fromValue) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'rga2025.dev@gmail.com',
      pass: 'bfvwachshcvcrzed'
    }
  });

  try {
    const info = await transporter.sendMail({
      from: fromValue,
      to: 'rga2025.dev@gmail.com',
      subject: 'Debug: Test ' + fromValue,
      html: '<h1>Debug</h1>'
    });
    console.log('Success with "' + fromValue + '":', info.messageId);
  } catch (err) {
    console.error('Error with "' + fromValue + '":', err.message);
  }
}

async function runTests() {
  await test('RGA Verification');
  await test('RGA Verification <rga2025.dev@gmail.com>');
}

runTests();
