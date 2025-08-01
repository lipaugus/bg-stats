import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    res.status(500).send('Missing MONGODB_URI');
    return;
  }

  let payload;
  try {
    payload = req.body;
    // If payload is undefined, parse manually
    if (!payload || typeof payload !== 'object') {
      payload = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  } catch (err) {
    res.status(400).send('Invalid JSON');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('data');
    const col = db.collection('mainLogs');
    await col.insertOne(payload);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mongo error:', err);
    res.status(500).send('Database error');
  } finally {
    await client.close();
  }
}