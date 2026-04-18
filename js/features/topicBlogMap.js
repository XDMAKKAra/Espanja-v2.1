import { track } from "../analytics.js";

let _cache = null;
let _loading = null;

async function loadMap() {
  if (_cache) return _cache;
  if (_loading) return _loading;
  _loading = fetch("/data/topic-blog-map.json", { cache: "force-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`topic-blog-map fetch ${r.status}`);
      return r.json();
    })
    .then((data) => {
      _cache = data;
      return data;
    })
    .catch((err) => {
      _loading = null;
      throw err;
    });
  return _loading;
}

export async function getBlogForTopic(topicKey) {
  if (!topicKey) return null;
  try {
    const data = await loadMap();
    const topics = data.topics || {};
    const aliases = data.aliases || {};
    const resolved = topics[topicKey] ? topicKey : aliases[topicKey];
    if (!resolved) return null;
    const entry = topics[resolved];
    if (!entry) return null;
    return { key: resolved, ...entry };
  } catch {
    return null;
  }
}

export function trackBlogClick(source, topicKey, url) {
  track("app_to_blog_click", {
    source,
    topic: topicKey || null,
    url: url || null,
  });
}
