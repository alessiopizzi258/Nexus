import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;

if (!uri) throw new Error('Manca MONGODB_URI nel file .env');

const options = {
  // Ottimizzazione per grandi volumi
  maxPoolSize: 10,             // Mantiene fino a 10 connessioni aperte pronte all'uso
  minPoolSize: 5,              // Mantiene sempre 5 connessioni calde
  connectTimeoutMS: 10000,     // Timeout di connessione 10s
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb() {
  try {
    const conn = await clientPromise;
    // Rimosso log ad ogni chiamata per evitare "log flooding"
    return conn.db();
  } catch (e: any) {
    console.error("❌ Database Connection Error:", e.message);
    throw e;
  }
}