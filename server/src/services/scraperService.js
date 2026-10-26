import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

/**
 * Normalizes text content: trims redundant blank lines and spaces while preserving structure
 */
export const normalizeText = (text, ignoreWhitespace = true) => {
  if (!text) return '';
  if (!ignoreWhitespace) return text.trim();
  
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
};

/**
 * Computes a SHA-256 hash for content comparison
 */
export const computeHash = (content) => {
  return crypto.createHash('sha256').update(content || '').digest('hex');
};

/**
 * Scrapes a target URL and extracts readable text and metadata
 */
export const scrapePage = async (url, selector = '', ignoreWhitespace = true) => {
  const startTime = Date.now();
  
  try {
    // Add protocol if missing
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SiteWatch/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Handle 4xx as valid responses to record
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract title
    const pageTitle = $('title').first().text().trim() || 
                      $('meta[property="og:title"]').attr('content') || 
                      'Untitled Page';

    // Remove non-content elements to avoid false positives (e.g., dynamic timestamps in scripts)
    $('script, style, noscript, svg, link, iframe').remove();

    let rawExtractedText = '';
    let usedSelector = selector;

    if (selector && selector.trim().length > 0) {
      const selectedEl = $(selector.trim());
      if (selectedEl.length > 0) {
        rawExtractedText = selectedEl.text();
      } else {
        // Fallback to body if selector didn't match
        console.warn(`[Scraper] Selector "${selector}" not found on ${targetUrl}, falling back to body.`);
        usedSelector = 'body (fallback)';
        rawExtractedText = $('body').text();
      }
    } else {
      rawExtractedText = $('body').text() || $('html').text();
    }

    const cleanedText = normalizeText(rawExtractedText, ignoreWhitespace);
    const contentHash = computeHash(cleanedText);

    return {
      success: true,
      url: targetUrl,
      title: pageTitle,
      extractedText: cleanedText,
      contentHash,
      contentLength: cleanedText.length,
      statusCode,
      responseTime,
      usedSelector,
      timestamp: new Date(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let statusCode = 500;
    let message = error.message;

    if (error.response) {
      statusCode = error.response.status;
      message = `Server responded with status code ${statusCode}`;
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out after 15 seconds';
    } else if (error.code === 'ENOTFOUND') {
      message = 'Domain or host name not found';
    }

    return {
      success: false,
      url,
      statusCode,
      responseTime,
      error: message,
      timestamp: new Date(),
    };
  }
};
