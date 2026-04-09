import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/admin', '/api/', '/checkout', '/cart', '/account', '/login', '/register']
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      // Explicit allow for AI crawlers — helps BOSY show up in
      // ChatGPT web search, Google AI Overviews, Claude, Perplexity,
      // Apple Intelligence, etc.
      { userAgent: 'GPTBot', allow: '/', disallow },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow },
      { userAgent: 'ChatGPT-User', allow: '/', disallow },
      { userAgent: 'Google-Extended', allow: '/', disallow },
      { userAgent: 'ClaudeBot', allow: '/', disallow },
      { userAgent: 'Claude-Web', allow: '/', disallow },
      { userAgent: 'anthropic-ai', allow: '/', disallow },
      { userAgent: 'PerplexityBot', allow: '/', disallow },
      { userAgent: 'Applebot-Extended', allow: '/', disallow },
      { userAgent: 'CCBot', allow: '/', disallow },
      { userAgent: 'Bytespider', allow: '/', disallow },
    ],
    sitemap: 'https://bosy.bg/sitemap.xml',
    host: 'https://bosy.bg',
  }
}
