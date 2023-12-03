/**
 * Extract image URLs from markdown
 */
export function extractMarkdownImageUrls(markdown: string): string[] {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  let match: RegExpExecArray | null;
  const urls: string[] = [];

  while ((match = imageRegex.exec(markdown))) {
    urls.push(match[1]);
  }

  return urls;
}

/**
 * Extract image URLs from HTML
 */
export function extractHtmlImageUrls(html: string): string[] {
  const imageRegex = /<img.*?src="(.*?)".*?>/g;
  let match: RegExpExecArray | null;
  const urls: string[] = [];

  while ((match = imageRegex.exec(html))) {
    urls.push(match[1]);
  }

  return urls;
}
