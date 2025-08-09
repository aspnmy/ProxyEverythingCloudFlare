(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // .wrangler/tmp/bundle-QFeIjl/checked-fetch.js
  var urls = /* @__PURE__ */ new Set();
  function checkURL(request, init) {
    const url = request instanceof URL ? request : new URL(
      (typeof request === "string" ? new Request(request, init) : request).url
    );
    if (url.port && url.port !== "443" && url.protocol === "https:") {
      if (!urls.has(url.toString())) {
        urls.add(url.toString());
        console.warn(
          `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
        );
      }
    }
  }
  __name(checkURL, "checkURL");
  globalThis.fetch = new Proxy(globalThis.fetch, {
    apply(target, thisArg, argArray) {
      const [request, init] = argArray;
      checkURL(request, init);
      return Reflect.apply(target, thisArg, argArray);
    }
  });

  // d:/bash/.npm_global/node_modules/wrangler/templates/middleware/common.ts
  var __facade_middleware__ = [];
  function __facade_register__(...args) {
    __facade_middleware__.push(...args.flat());
  }
  __name(__facade_register__, "__facade_register__");
  function __facade_registerInternal__(...args) {
    __facade_middleware__.unshift(...args.flat());
  }
  __name(__facade_registerInternal__, "__facade_registerInternal__");
  function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
    const [head, ...tail] = middlewareChain;
    const middlewareCtx = {
      dispatch,
      next(newRequest, newEnv) {
        return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
      }
    };
    return head(request, env, ctx, middlewareCtx);
  }
  __name(__facade_invokeChain__, "__facade_invokeChain__");
  function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
    return __facade_invokeChain__(request, env, ctx, dispatch, [
      ...__facade_middleware__,
      finalMiddleware
    ]);
  }
  __name(__facade_invoke__, "__facade_invoke__");

  // d:/bash/.npm_global/node_modules/wrangler/templates/middleware/loader-sw.ts
  var __FACADE_EVENT_TARGET__;
  if (globalThis.MINIFLARE) {
    __FACADE_EVENT_TARGET__ = new (Object.getPrototypeOf(WorkerGlobalScope))();
  } else {
    __FACADE_EVENT_TARGET__ = new EventTarget();
  }
  function __facade_isSpecialEvent__(type) {
    return type === "fetch" || type === "scheduled";
  }
  __name(__facade_isSpecialEvent__, "__facade_isSpecialEvent__");
  var __facade__originalAddEventListener__ = globalThis.addEventListener;
  var __facade__originalRemoveEventListener__ = globalThis.removeEventListener;
  var __facade__originalDispatchEvent__ = globalThis.dispatchEvent;
  globalThis.addEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.addEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalAddEventListener__(type, listener, options);
    }
  };
  globalThis.removeEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.removeEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalRemoveEventListener__(type, listener, options);
    }
  };
  globalThis.dispatchEvent = function(event) {
    if (__facade_isSpecialEvent__(event.type)) {
      return __FACADE_EVENT_TARGET__.dispatchEvent(event);
    } else {
      return __facade__originalDispatchEvent__(event);
    }
  };
  globalThis.addMiddleware = __facade_register__;
  globalThis.addMiddlewareInternal = __facade_registerInternal__;
  var __facade_waitUntil__ = Symbol("__facade_waitUntil__");
  var __facade_response__ = Symbol("__facade_response__");
  var __facade_dispatched__ = Symbol("__facade_dispatched__");
  var __Facade_ExtendableEvent__ = class ___Facade_ExtendableEvent__ extends Event {
    static {
      __name(this, "__Facade_ExtendableEvent__");
    }
    [__facade_waitUntil__] = [];
    waitUntil(promise) {
      if (!(this instanceof ___Facade_ExtendableEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this[__facade_waitUntil__].push(promise);
    }
  };
  var __Facade_FetchEvent__ = class ___Facade_FetchEvent__ extends __Facade_ExtendableEvent__ {
    static {
      __name(this, "__Facade_FetchEvent__");
    }
    #request;
    #passThroughOnException;
    [__facade_response__];
    [__facade_dispatched__] = false;
    constructor(type, init) {
      super(type);
      this.#request = init.request;
      this.#passThroughOnException = init.passThroughOnException;
    }
    get request() {
      return this.#request;
    }
    respondWith(response) {
      if (!(this instanceof ___Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      if (this[__facade_response__] !== void 0) {
        throw new DOMException(
          "FetchEvent.respondWith() has already been called; it can only be called once.",
          "InvalidStateError"
        );
      }
      if (this[__facade_dispatched__]) {
        throw new DOMException(
          "Too late to call FetchEvent.respondWith(). It must be called synchronously in the event handler.",
          "InvalidStateError"
        );
      }
      this.stopImmediatePropagation();
      this[__facade_response__] = response;
    }
    passThroughOnException() {
      if (!(this instanceof ___Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#passThroughOnException();
    }
  };
  var __Facade_ScheduledEvent__ = class ___Facade_ScheduledEvent__ extends __Facade_ExtendableEvent__ {
    static {
      __name(this, "__Facade_ScheduledEvent__");
    }
    #scheduledTime;
    #cron;
    #noRetry;
    constructor(type, init) {
      super(type);
      this.#scheduledTime = init.scheduledTime;
      this.#cron = init.cron;
      this.#noRetry = init.noRetry;
    }
    get scheduledTime() {
      return this.#scheduledTime;
    }
    get cron() {
      return this.#cron;
    }
    noRetry() {
      if (!(this instanceof ___Facade_ScheduledEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#noRetry();
    }
  };
  __facade__originalAddEventListener__("fetch", (event) => {
    const ctx = {
      waitUntil: event.waitUntil.bind(event),
      passThroughOnException: event.passThroughOnException.bind(event)
    };
    const __facade_sw_dispatch__ = /* @__PURE__ */ __name(function(type, init) {
      if (type === "scheduled") {
        const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
          scheduledTime: Date.now(),
          cron: init.cron ?? "",
          noRetry() {
          }
        });
        __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
        event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      }
    }, "__facade_sw_dispatch__");
    const __facade_sw_fetch__ = /* @__PURE__ */ __name(function(request, _env, ctx2) {
      const facadeEvent = new __Facade_FetchEvent__("fetch", {
        request,
        passThroughOnException: ctx2.passThroughOnException
      });
      __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
      facadeEvent[__facade_dispatched__] = true;
      event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      const response = facadeEvent[__facade_response__];
      if (response === void 0) {
        throw new Error("No response!");
      }
      return response;
    }, "__facade_sw_fetch__");
    event.respondWith(
      __facade_invoke__(
        event.request,
        globalThis,
        ctx,
        __facade_sw_dispatch__,
        __facade_sw_fetch__
      )
    );
  });
  __facade__originalAddEventListener__("scheduled", (event) => {
    const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
      scheduledTime: event.scheduledTime,
      cron: event.cron,
      noRetry: event.noRetry.bind(event)
    });
    __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
    event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
  });

  // d:/bash/.npm_global/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
  var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } finally {
      try {
        if (request.body !== null && !request.bodyUsed) {
          const reader = request.body.getReader();
          while (!(await reader.read()).done) {
          }
        }
      } catch (e) {
        console.error("Failed to drain the unused request body.", e);
      }
    }
  }, "drainBody");
  var middleware_ensure_req_body_drained_default = drainBody;

  // d:/bash/.npm_global/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
  function reduceError(e) {
    return {
      name: e?.name,
      message: e?.message ?? String(e),
      stack: e?.stack,
      cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
    };
  }
  __name(reduceError, "reduceError");
  var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } catch (e) {
      const error = reduceError(e);
      return Response.json(error, {
        status: 500,
        headers: { "MF-Experimental-Error-Stack": "true" }
      });
    }
  }, "jsonError");
  var middleware_miniflare3_json_error_default = jsonError;

  // .wrangler/tmp/bundle-QFeIjl/middleware-insertion-facade.js
  __facade_registerInternal__([middleware_ensure_req_body_drained_default, middleware_miniflare3_json_error_default]);

  // worker.js
  var BLACKLIST = BKLS;
  var BINDLIST = "";
  function isBlacklisted(url) {
    const hostname = new URL(url).hostname;
    return BLACKLIST.some((blocked) => hostname.includes(blocked));
  }
  __name(isBlacklisted, "isBlacklisted");
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
    return illegalPatterns.some((pattern) => pattern.test(urlStr));
  }
  __name(hasIllegalParams, "hasIllegalParams");
  addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
  });
  async function handleRequest(request) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/") {
        return new Response(getRootHtml(), {
          headers: {
            "Content-Type": "text/html; charset=utf-8"
          }
        });
      }
      let actualUrlStr = decodeURIComponent(url.pathname.replace("/", ""));
      actualUrlStr = ensureProtocol(actualUrlStr, url.protocol);
      const actualUrl = new URL(actualUrlStr);
      if (actualUrl.hostname.length > 16) {
        return jsonResponse({
          error: "Domain name length exceeds 16 characters."
        }, 400);
      }
      if (hasIllegalParams(actualUrl)) {
        if (BINDLIST) {
          BINDLIST += "," + actualUrlStr;
        } else {
          BINDLIST = actualUrlStr;
        }
        return jsonResponse({
          error: "Illegal parameters detected in URL."
        }, 400);
      }
      if (isBlacklisted(actualUrlStr)) {
        return jsonResponse({
          error: "Access to this website is blocked."
        }, 403);
      }
      actualUrlStr += url.search;
      const newHeaders = filterHeaders(request.headers, (name) => !name.startsWith("cf-"));
      const modifiedRequest = new Request(actualUrlStr, {
        headers: newHeaders,
        method: request.method,
        body: request.body,
        redirect: "manual"
      });
      const response = await fetch(modifiedRequest);
      let body = response.body;
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        body = response.body;
        return handleRedirect(response, body);
      } else if (response.headers.get("Content-Type")?.includes("text/html")) {
        body = await handleHtmlContent(response, url.protocol, url.host, actualUrlStr);
      }
      const modifiedResponse = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      setNoCacheHeaders(modifiedResponse.headers);
      setCorsHeaders(modifiedResponse.headers);
      return modifiedResponse;
    } catch (error) {
      return jsonResponse({
        error: error.message
      }, 500);
    }
  }
  __name(handleRequest, "handleRequest");
  function ensureProtocol(url, defaultProtocol) {
    return url.startsWith("http://") || url.startsWith("https://") ? url : defaultProtocol + "//" + url;
  }
  __name(ensureProtocol, "ensureProtocol");
  function handleRedirect(response, body) {
    const location = new URL(response.headers.get("location"));
    const modifiedLocation = `/${encodeURIComponent(location.toString())}`;
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        "Location": modifiedLocation
      }
    });
  }
  __name(handleRedirect, "handleRedirect");
  async function handleHtmlContent(response, protocol, host, actualUrlStr) {
    const originalText = await response.text();
    const regex = new RegExp(`((href|src|action)=["'])/(?!/)`, "g");
    let modifiedText = replaceRelativePaths(originalText, protocol, host, new URL(actualUrlStr).origin);
    return modifiedText;
  }
  __name(handleHtmlContent, "handleHtmlContent");
  function replaceRelativePaths(text, protocol, host, origin) {
    const regex = new RegExp(`((href|src|action)=["'])/(?!/)`, "g");
    return text.replace(regex, `$1${protocol}//${host}/${origin}/`);
  }
  __name(replaceRelativePaths, "replaceRelativePaths");
  function jsonResponse(data, status) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    });
  }
  __name(jsonResponse, "jsonResponse");
  function filterHeaders(headers, filterFunc) {
    return new Headers([...headers].filter(([name]) => filterFunc(name)));
  }
  __name(filterHeaders, "filterHeaders");
  function setNoCacheHeaders(headers) {
    headers.set("Cache-Control", "no-store");
  }
  __name(setNoCacheHeaders, "setNoCacheHeaders");
  function setCorsHeaders(headers) {
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    headers.set("Access-Control-Allow-Headers", "*");
  }
  __name(setCorsHeaders, "setCorsHeaders");
  function getRootHtml() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css" rel="stylesheet">
  <title>Proxy Everything \u4E07\u7AD9\u4E92\u8054</title>
  <link rel="icon" type="image/png" href="https://about.gitea.com/gitea-text.svg@100w.webp">
  <meta name="Description" content="Proxy Everything with CF Workers.">
  <meta property="og:description" content="Proxy Everything with CF Workers.">
  <meta property="og:image" content="https://about.gitea.com/gitea-text.svg@100w.webp">
  <meta name="robots" content="index, follow">
  <meta http-equiv="Content-Language" content="zh-CN">
  <link rel="apple-touch-icon-precomposed" sizes="120x120" href="https://about.gitea.com/gitea-text.svg@100w.webp">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
  <style>
      body, html {
          height: 100%;
          margin: 0;
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
                          <span class="card-title center-align"><i class="material-icons left">link</i>Proxy Everything \u4E07\u7AD9\u4E92\u8054</span>
                          <form id="urlForm" onsubmit="redirectToProxy(event)">
                              <div class="input-field">
                                  <input type="text" id="targetUrl" placeholder="\u5728\u6B64\u8F93\u5165\u76EE\u6807\u5730\u5740,\u4E0D\u9700\u8981\u8F93\u5165\u534F\u8BAE\u5934" required>
                                  <label for="targetUrl">\u76EE\u6807\u5730\u5740</label>
                              </div>
                              <button type="submit" class="btn waves-effect waves-light teal darken-2 full-width">\u8DF3\u8F6C</button>
                               <div class="warning">\u4F7F\u7528\u8BF4\u660E\uFF1A\u88AB\u8F6C\u53D1\u7684\u57DF\u540D\u957F\u5EA6\u5FC5\u987B\u5C0F\u4E8E16\u4E2A\u5B57\u7B26\u4E32\uFF0C\u8BF7\u4E0D\u8981\u8F6C\u53D1\u5E26\u6709\u6E17\u5165\u4EE3\u7801\u7684\u975E\u6CD5\u94FE\u63A5</div>
                               <div class="warning">\u66F4\u591A\u9ED1\u540D\u5355\u7F51\u5740\u4FE1\u606F\uFF0C\u67E5\u770Bgithub\u9879\u76EE\uFF1Ahttps://github.com/aspnmy/CN-Malicious-website-list.git</div>
                          </form>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"><\/script>
  <script>
      function redirectToProxy(event) {
          event.preventDefault();
          const targetUrl = document.getElementById('targetUrl').value.trim();
          const currentOrigin = window.location.origin;
          window.open(currentOrigin + '/' + encodeURIComponent(targetUrl), '_blank');
      }
  <\/script>
</body>
</html>`;
  }
  __name(getRootHtml, "getRootHtml");
})();
//# sourceMappingURL=worker.js.map
