export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await fetch('http://api.open-notify.org/iss-now.json');
    const data = await response.json();
    res.status(200).json(data);
  } catch {
    // Fallback to wheretheiss.at
    try {
      const r = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      const d = await r.json();
      res.status(200).json({
        message: 'success',
        iss_position: { latitude: String(d.latitude), longitude: String(d.longitude) },
        timestamp: Math.floor(d.timestamp),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
}
