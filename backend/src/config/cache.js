import NodeCache from "node-cache";

export const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes default

export const cacheMiddleware = (duration) => (req, res, next) => {
  // Skip cache for authenticated routes or POST/PUT/DELETE requests
  if (req.method !== "GET") {
    return next();
  }

  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log(`Cache hit for ${key}`);
    return res.json(cachedResponse);
  }

  // Store the original send method
  res.originalSend = res.send;
  res.send = function (body) {
    // Only cache successful responses
    if (res.statusCode === 200) {
      console.log(`Caching response for ${key}`);
      cache.set(key, JSON.parse(body), duration);
    }
    res.originalSend(body);
  };
  next();
};
