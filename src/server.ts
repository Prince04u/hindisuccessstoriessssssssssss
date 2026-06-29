import "./lib/error-capture";

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const mod = await import("@tanstack/react-start/server-entry");
    const handler: any = mod.default ?? mod;
    return handler.fetch(request, env, ctx);
  },
};
