import puppeteer from "puppeteer";

/**
 * Captures the rendered HTML as a screenshot and returns it as a buffer.
 */
export async function captureRenderedHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setContent(html, {
    timeout: 60_000,
  });
  const buffer = await page.screenshot({ fullPage: true });
  return buffer;
}
