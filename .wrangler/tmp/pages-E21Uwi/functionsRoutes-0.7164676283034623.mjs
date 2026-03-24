import { onRequestGet as __ogn_proxy_js_onRequestGet } from "D:\\ClaudeCodeMain\\GliderOGNWeather\\functions\\ogn-proxy.js"

export const routes = [
    {
      routePath: "/ogn-proxy",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__ogn_proxy_js_onRequestGet],
    },
  ]