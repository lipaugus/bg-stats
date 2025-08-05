import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    res.status(500).send('Missing MONGODB_URI');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('data');
    const col = db.collection('mainLogs');
    const logs = await col.find({}).toArray();
    res.status(200).json(logs);
  } catch (err) {
    console.error('Mongo error:', err);
    res.status(500).send('Database error');
  } finally {
    await client.close();
  }
}