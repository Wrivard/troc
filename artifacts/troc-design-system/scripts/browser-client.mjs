/** Small dependency-free Chrome DevTools client for the style-guide checks. */
export async function connectBrowser(port = 9222) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((item) => item.type === "page");
  if (!target) throw new Error("Start headless Chromium with --remote-debugging-port=9222.");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    if (event.method === "Runtime.exceptionThrown") {
      const detail = event.params.exceptionDetails;
      errors.push(detail.exception?.description ?? detail.text);
    }
    if (!event.id) return;
    const request = pending.get(event.id);
    if (!request) return;
    clearTimeout(request.timeout);
    pending.delete(event.id);
    if (event.error) request.reject(new Error(event.error.message));
    else request.resolve(event.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Browser command timed out: ${method}`));
    }, 15000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  };
  const wait = async (expression, timeout = 8000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try { if (await evaluate(expression)) return; } catch { /* A navigation can replace the execution context. */ }
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    throw new Error(`Browser condition timed out: ${expression}`);
  };
  const loaded = () => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { socket.removeEventListener("message", listener); reject(new Error("Page load timed out.")); }, 15000);
    const listener = ({ data }) => {
      if (JSON.parse(data).method !== "Page.loadEventFired") return;
      clearTimeout(timeout);
      socket.removeEventListener("message", listener);
      resolve();
    };
    socket.addEventListener("message", listener);
  });
  const navigate = async (url) => { const ready = loaded(); await send("Page.navigate", { url }); await ready; };
  const reload = async () => { const ready = loaded(); await send("Page.reload"); await ready; };
  const page = async (id) => {
    await evaluate(`location.hash=${JSON.stringify(`page=${id}`)}`);
    await wait(`document.querySelector('.ds-sidebar nav a[aria-current="page"]')?.getAttribute('href')===${JSON.stringify(`#page=${id}`)} && !!document.querySelector('main h1') && !document.querySelector('.ds-loading-page')`);
    await evaluate("document.fonts.ready");
  };
  const key = async (key, code = key, keyCode = 0) => {
    const data = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
    const text = key === "Enter" ? "\r" : key.length === 1 ? key : undefined;
    await send("Input.dispatchKeyEvent", { type: "keyDown", ...data, ...(text ? { text, unmodifiedText: text } : {}) });
    await send("Input.dispatchKeyEvent", { type: "keyUp", ...data });
  };
  await send("Page.enable");
  await send("Runtime.enable");
  return { send, evaluate, wait, navigate, reload, page, key, errors, close: () => socket.close() };
}