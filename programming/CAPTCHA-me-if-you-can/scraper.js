const util = require('util');
const exec = util.promisify(require('child_process').exec);
const playwright = require("playwright");

async function main() {
  const browser = await playwright.chromium.launch({
    headless: false,
  });

  const page = await browser.newPage({});

  await page.goto("http://challenge01.root-me.org/programmation/ch8/");

  // Select the #svg img element and save the screenshot.
  const svgImage = await page.$("img");
  await svgImage.screenshot({
    path: "screenshot.png",
    omitBackground: true,
  });

  const { stdout, _stderr } = await exec("gocr -i screenshot.png");

  await page.type('input[name="cametu"]', stdout);
  await page.keyboard.press('Enter');

  // await browser.close();
}

main();
