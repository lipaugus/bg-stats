import { MongoClient } from 'mongodb';

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const uri = env.MONGODB_URI;
  if (!uri) {
    return new Response('Missing MONGODB_URI', { status: 500 });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('data');
    const col = db.collection('mainLogs');
    await col.insertOne(payload);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Mongo error:', err);
    return new Response('Database error', { status: 500 });
  } finally {
    await client.close();
  }
}
