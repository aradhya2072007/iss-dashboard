export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { q } = req.query;
  const apiKey = process.env.VITE_NEWS_API_KEY;
  
  let url;
  if (q) {
    url = `https://newsapi.org/v2/everything?apiKey=${apiKey}&pageSize=10&language=en&q=${encodeURIComponent(q)}&sortBy=publishedAt`;
  } else {
    url = `https://newsapi.org/v2/top-headlines?apiKey=${apiKey}&pageSize=10&language=en&country=us`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
