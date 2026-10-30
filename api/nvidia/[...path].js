export const config = {
  api: {
    bodyParser: false, // stream or handle raw body for multi-part/json
  },
};

export default async function handler(req, res) {
  // CORS support
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-requested-with");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "NVIDIA_API_KEY is not configured in environment variables."
    });
  }

  try {
    let pathParam = req.query.path;
    let pathSegments = Array.isArray(pathParam) ? pathParam : (pathParam ? [pathParam] : []);
    
    // Normalize path to strip leading "v1" if provided in the URL
    if (pathSegments[0] === "v1") {
      pathSegments = pathSegments.slice(1);
    }
    const targetSubpath = pathSegments.join("/");
    const targetUrl = `https://integrate.api.nvidia.com/v1/${targetSubpath}`;

    // Read raw body if present
    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      body = Buffer.concat(chunks);
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };
    if (req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    }

    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const contentType = upstreamRes.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", contentType);
    res.status(upstreamRes.status);

    const data = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(data));
  } catch (error) {
    console.error("[NVIDIA Proxy Error]:", error);
    return res.status(502).json({
      error: "Failed to proxy request to NVIDIA API",
      message: error.message
    });
  }
}
