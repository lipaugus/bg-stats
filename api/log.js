import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await client.connect();
    const db = client.db('data');
    const col = db.collection('mainLogs');
    await col.insertOne(req.body);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mongo error:', err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    await client.close();
  }
}
