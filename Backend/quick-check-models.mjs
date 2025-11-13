// list-models.mjs
import process from "process";

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("Set GOOGLE_API_KEY in your environment first.");
  process.exit(1);
}

async function callModelsApi(version = "v1") {
  const base = `https://generativelanguage.googleapis.com/${version}/models`;
  const url = `${base}?key=${encodeURIComponent(API_KEY)}`;
  try {
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    console.log(`\n--- ${version} --- status: ${res.status}`);
    try {
      const data = JSON.parse(text);
      console.log(JSON.stringify(data, null, 2));
      return data;
    } catch {
      console.log("Raw response text:", text.slice(0, 1000));
      return null;
    }
  } catch (err) {
    console.error(`Request error for ${version}:`, err);
    return null;
  }
}

(async () => {
  // try both v1 and v1beta (some models are only on v1beta)
  await callModelsApi("v1");
  console.log("\nTrying v1beta...");
  await callModelsApi("v1beta");
})();
