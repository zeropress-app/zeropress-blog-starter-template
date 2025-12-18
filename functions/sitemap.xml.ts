// Cloudflare Pages Function for sitemap.xml
export async function onRequest(context: any): Promise<Response> {
  try {
    // 백엔드 API에서 포스트 데이터 가져오기
    const backendUrl = 'https://lael-blog-api.wini.workers.dev/api/posts?published=true&limit=100';
    
    const response = await fetch(backendUrl);
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const data = await response.json();
    const posts = data.data || [];
    
    // 현재 도메인 가져오기
    const url = new URL(context.request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // XML 생성
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // 홈페이지
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    // 각 포스트
    for (const post of posts) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/post/${post.id}</loc>\n`;
      xml += `    <lastmod>${post.updatedAt.split('T')[0]}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }
    
    xml += '</urlset>';
    
    // XML 응답 반환
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // 에러 발생 시 기본 sitemap 반환
    const url = new URL(context.request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300', // 5분 캐시 (에러 시)
      },
    });
  }
}