
// Add KV read and write tools
let BLACKLIST = [];
let BINDLIST = [];

export default {
  async fetch(request, env, ctx) {
    // Read values from KV
    const blacklistStr = await env.BKLS_STORE.get("BKLS");
    if (blacklistStr) {
      // Remove single quotes from the string, then split by commas
      BLACKLIST = blacklistStr.replace(/'/g, '').split(',').filter(item => item !== '');
    } else {
      BLACKLIST = [];
    }
    
    return handleRequest(request, env);
  }
};

// Check if the URL is in the blacklist
function isBlacklisted(url) {
  try {
    const hostname = new URL(url).hostname;
    return BLACKLIST.some(blocked => hostname.includes(blocked));
  } catch (error) {
    // If URL parsing fails, directly check if the original URL is in the blacklist
    return BLACKLIST.some(blocked => url.includes(blocked));
  }
}

// Check if the URL contains illegal parameters
function hasIllegalParams(url) {
  const illegalPatterns = [
    /<script/i,
    /javascript:/i,
    /onload/i,
    /onerror/i,
    /onclick/i,
    /onmouseover/i,
    /onfocus/i,
    /onblur/i,
    /onsubmit/i,
    /onreset/i,
    /onselect/i,
    /onchange/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /document\.write/i,
    /\.innerHTML/i,
    /\.outerHTML/i
  ];
  
  const urlStr = url.toString();
  return illegalPatterns.some(pattern => pattern.test(urlStr));
}



async function handleRequest(request, env) {
  try {
      // Read values from KV
      const blacklistStr = await env.BKLS_STORE.get("BKLS");
      if (blacklistStr) {
        // Remove single quotes from the string, then split by commas
        BLACKLIST = blacklistStr.replace(/'/g, '').split(',').filter(item => item !== '');
      } else {
        BLACKLIST = [];
      }
      
      const url = new URL(request.url);

      // If accessing the root directory, return HTML
      if (url.pathname === "/") {
          const response = new Response(getRootHtml(), {
              headers: {
                  'Content-Type': 'text/html; charset=utf-8',
                  'X-Content-Type-Options': 'nosniff'
              }
          });
          // Add no-cache headers
          setNoCacheHeaders(response.headers);
          return response;
      }

      // Extract the target URL from the request path
      let actualUrlStr = decodeURIComponent(url.pathname.replace("/", ""));

      // Determine if the user input URL has a protocol
      actualUrlStr = ensureProtocol(actualUrlStr, url.protocol);
      
      // Check domain length
      const actualUrl = new URL(actualUrlStr);
      if (actualUrl.hostname.length > 128) {
          return jsonResponse({
              error: 'Domain name length exceeds 128 characters.'
          }, 400);
      }

      // Check if the target URL contains illegal parameters
      if (hasIllegalParams(actualUrl)) {
          // Add illegal URL to BINDLIST
          BINDLIST.push(actualUrlStr);
          
          return jsonResponse({
              error: 'Illegal parameters detected in URL.'
          }, 400);
      }

      // Check if the target URL is in the blacklist
      if (isBlacklisted(actualUrlStr)) {
          return jsonResponse({
              error: 'Access to this website is blocked.'
          }, 403);
      }

      // Preserve query parameters
      actualUrlStr += url.search;

      // Create a new Headers object, excluding headers starting with 'cf-'
      const newHeaders = filterHeaders(request.headers, name => !name.startsWith('cf-'));

      // Create a new request to access the target URL
      const modifiedRequest = new Request(actualUrlStr, {
          headers: newHeaders,
          method: request.method,
          body: request.body,
          redirect: 'manual'
      });

      // Initiate a request to the target URL
      const response = await fetch(modifiedRequest);
      let body = response.body;

      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(response.status)) {
          body = response.body;
          // Create a new Response object to modify the Location header
          return handleRedirect(response, body);
      } else if (response.headers.get("Content-Type")?.includes("text/html")) {
          body = await handleHtmlContent(response, url.protocol, url.host, actualUrlStr);
      }

      // Create the modified response object
      const modifiedResponse = new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
      });

      // Add no-cache headers
      setNoCacheHeaders(modifiedResponse.headers);

      // Add security headers
      modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff');

      // Add CORS headers to allow cross-origin access
      setCorsHeaders(modifiedResponse.headers);

      return modifiedResponse;
  } catch (error) {
      // If an error occurs when requesting the target address, return a response with the error message and status code 500 (server error)
      return jsonResponse({
          error: error.message
      }, 500);
  } finally {
      // Add illegal URLs from BINDLIST to BLACKLIST and update KV storage
      if (BINDLIST.length > 0) {
          BLACKLIST = [...new Set([...BLACKLIST, ...BINDLIST])];
          // Update KV storage, ensuring the data format is 'url1','url2'
          if (env && env.BKLS_STORE) {
              await env.BKLS_STORE.put("BKLS", BLACKLIST.map(url => `'${url}'`).join(','));
          }
          // Clear BINDLIST
          BINDLIST = [];
      }
  }
}

// Ensure the URL has a protocol
function ensureProtocol(url, defaultProtocol) {
  return url.startsWith("http://") || url.startsWith("https://") ? url : defaultProtocol + "//" + url;
}

// Handle redirects
function handleRedirect(response, body) {
  const location = new URL(response.headers.get('location'));
  const modifiedLocation = `/${encodeURIComponent(location.toString())}`;
  const newResponse = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
          ...response.headers,
          'Location': modifiedLocation
      }
  });
  // Add no-cache headers
  setNoCacheHeaders(newResponse.headers);
  // Add security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  return newResponse;
}

// Handle relative paths in HTML content
async function handleHtmlContent(response, protocol, host, actualUrlStr) {
  const originalText = await response.text();
  const regex = new RegExp('((href|src|action)=["\'])/(?!/)', 'g');
  let modifiedText = replaceRelativePaths(originalText, protocol, host, new URL(actualUrlStr).origin);
  const newResponse = new Response(modifiedText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
  });
  // Add no-cache headers
  setNoCacheHeaders(newResponse.headers);
  // Add security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  return newResponse;
}

// Replace relative paths in HTML content
function replaceRelativePaths(text, protocol, host, origin) {
  const regex = new RegExp('((href|src|action)=["\'])/(?!/)', 'g');
  return text.replace(regex, `$1${protocol}//${host}/${origin}/`);
}

// Return JSON formatted response
function jsonResponse(data, status) {
  const response = new Response(JSON.stringify(data), {
      status: status,
      headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
      }
  });
  // Add no-cache headers
  setNoCacheHeaders(response.headers);
  return response;
}

// Filter request headers
function filterHeaders(headers, filterFunc) {
  return new Headers([...headers].filter(([name]) => filterFunc(name)));
}

// Set no-cache headers
function setNoCacheHeaders(headers) {
  headers.set('Cache-Control', 'no-store, must-revalidate');
}

// Set CORS headers
function setCorsHeaders(headers) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  headers.set('Access-Control-Allow-Headers', '*');
}

// Return HTML for the root directory
function getRootHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js" as="script">
  <title>Proxy Everything</title>
  <link rel="icon" type="image/x-icon" href="https://image.cf.shdrr.org/favicon-02.ico" crossorigin="anonymous">
  <meta name="Description" content="Proxy Everything with CF Workers.万站互联.">
  <meta name="keywords" content="CF Worker, CF Worker API, Cloudflare Workers, Cloudflare CDN, CDNs, CDN, CDNJS, Google Fonts">
  <meta property="og:url" content="https://gateway.cf.shdrr.org/">
  <meta property="og:site_name" content="Proxy Everything 万站互联.">
  <meta property="og:description" content="Proxy Everything with CF Workers 万站互联..">
  <meta property="og:title" content="Proxy Everything with CF Workers 万站互联..">
  <meta property="og:description" content="Proxy Everything with CF Workers 万站互联..">
  <meta property="og:locale" content="zh-CN">
  <meta property="og:title" content="Proxy Everything 万站互联.">
  <meta property="og:description" content="Proxy Everything with CF Workers 万站互联..">
  <meta property="og:image" content="https://image.cf.shdrr.org/favicon-02.ico" crossorigin="anonymous">
  <meta name="robots" content="index, follow">
  <meta http-equiv="Content-Language" content="zh-CN">
  <link rel="apple-touch-icon-precomposed" sizes="120x120" href="https://image.cf.shdrr.org/favicon-02.ico" crossorigin="anonymous">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
      body, html {
          height: 100%;
          margin: 0;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          text-size-adjust: 100%;
          -webkit-mask-image: none;
          mask-image: none;
      }
      .background {
          background-size: cover;
          background-position: center;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
      }
      .card {
          background-color: rgba(255, 255, 255, 0.8);
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
      }
      .card:hover {
          background-color: rgba(255, 255, 255, 1);
          box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.3);
      }
      .input-field input[type=text] {
          color: #2c3e50;
      }
      .input-field input[type=text]:focus+label {
          color: #2c3e50 !important;
      }
      .input-field input[type=text]:focus {
          border-bottom: 1px solid #2c3e50 !important;
          box-shadow: 0 1px 0 0 #2c3e50 !important;
      }
      .warning {
          color: #ff5252;
          font-size: 0.9em;
          margin-top: 10px;
          text-align: left;
          /* Optimize for LCP */
          contain: layout style;
          content-visibility: auto;
      }
      @media (prefers-color-scheme: dark) {
          body, html {
              background-color: #121212;
              color: #e0e0e0;
          }
          .card {
              background-color: rgba(33, 33, 33, 0.9);
              color: #ffffff;
          }
          .card:hover {
              background-color: rgba(50, 50, 50, 1);
              box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.6);
          }
          .input-field input[type=text] {
              color: #ffffff;
          }
          .input-field input[type=text]:focus+label {
              color: #ffffff !important;
          }
          .input-field input[type=text]:focus {
              border-bottom: 1px solid #ffffff !important;
              box-shadow: 0 1px 0 0 #ffffff !important;
          }
          label {
              color: #cccccc;
          }
          .warning {
              color: #ff8a80;
          }
      }
  </style>
</head>
<body>
  <div class="background">
      <div class="container">
          <div class="row">
              <div class="col s12 m8 offset-m2 l6 offset-l3">
                  <div class="card">
                      <div class="card-content">
                          <span class="card-title center-align"><i class="material-icons left">link</i>Proxy Everything 万站互联</span>
                          <form id="urlForm" onsubmit="redirectToProxy(event)">
                              <div class="input-field">
                                  <input type="text" id="targetUrl" placeholder="Enter target URL here, no need to input protocol header" required>
                                  <label for="targetUrl">Target URL</label>
                              </div>
                              <button type="submit" class="btn waves-effect waves-light teal darken-2 full-width">Go</button>
                               <div class="warning">Instructions: The forwarded domain name length must be less than 128 characters. Please do not forward illegal links with injected code.</div>
                               <div class="warning">For more blacklist URL information, check the GitHub project: <a href="https://github.com/aspnmy/CN-Malicious-website-list.git">CN-Malicious-website-list</a></div>
                          </form>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js" async></script>
  <script>
      function redirectToProxy(event) {
          event.preventDefault();
          const targetUrl = document.getElementById('targetUrl').value.trim();
          const currentOrigin = window.location.origin;
          window.open(currentOrigin + '/' + encodeURIComponent(targetUrl), '_blank');
      }
  </script>
</body>
</html>`;
}