import puppeteer from "puppeteer";

/**
 * Captures the rendered HTML as a screenshot.
 */
export async function captureRenderedHtml(html: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setContent(html, {
    timeout: 60_000,
  });
  await page.screenshot({ path: "screenshot.png", fullPage: true });
}
