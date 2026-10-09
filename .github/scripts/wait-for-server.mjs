const url = process.env.PRODUCTION_SERVER_URL;
const deadline = Date.now() + 15_000;
while (true) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
    if (response.ok) break;
  } catch {}
  if (Date.now() >= deadline) throw new Error('Production server failed to start.');
  await new Promise((resolve) => setTimeout(resolve, 100));
}
