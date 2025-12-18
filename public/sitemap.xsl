<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>XML Sitemap</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <style type="text/css">
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #333;
      background: #f8f9fa;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
    }
    .stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 20px;
    }
    .stat {
      text-align: center;
    }
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      display: block;
    }
    .stat-label {
      font-size: 12px;
      opacity: 0.8;
    }
    .content {
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #f8f9fa;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e9ecef;
    }
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e9ecef;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .url {
      color: #0066cc;
      text-decoration: none;
      word-break: break-all;
    }
    .url:hover {
      text-decoration: underline;
    }
    .priority {
      font-weight: 600;
    }
    .priority-high { color: #28a745; }
    .priority-medium { color: #ffc107; }
    .priority-low { color: #6c757d; }
    .changefreq {
      background: #e9ecef;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>XML Sitemap</h1>
      <p>This sitemap contains <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs</p>
      <div class="stats">
        <div class="stat">
          <span class="stat-number"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
          <span class="stat-label">Total URLs</span>
        </div>
      </div>
    </div>
    <div class="content">
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Last Modified</th>
            <th>Change Frequency</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          <xsl:for-each select="sitemap:urlset/sitemap:url">
            <tr>
              <td>
                <a href="{sitemap:loc}" class="url">
                  <xsl:value-of select="sitemap:loc"/>
                </a>
              </td>
              <td><xsl:value-of select="sitemap:lastmod"/></td>
              <td>
                <span class="changefreq">
                  <xsl:value-of select="sitemap:changefreq"/>
                </span>
              </td>
              <td>
                <span class="priority">
                  <xsl:attribute name="class">
                    priority
                    <xsl:choose>
                      <xsl:when test="sitemap:priority &gt; 0.7"> priority-high</xsl:when>
                      <xsl:when test="sitemap:priority &gt; 0.4"> priority-medium</xsl:when>
                      <xsl:otherwise> priority-low</xsl:otherwise>
                    </xsl:choose>
                  </xsl:attribute>
                  <xsl:value-of select="sitemap:priority"/>
                </span>
              </td>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>