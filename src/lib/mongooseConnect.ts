// lib/mongooseConnect.ts
import mongoose, { ConnectionStates } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from Sgrowing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Asegúrate de que globalThis esté correctamente tipado si usas una versión de TS muy estricta
// Puedes usar (globalThis as any) o definir una interfaz global más específica.
let cached = (globalThis as any).mongoose as MongooseCache;

if (!cached) {
  cached = (globalThis as any).mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('MongoDB: Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Desactiva el buffering si prefieres que falle rápido si no hay conexión
      // useNewUrlParser: true, // Estas opciones ya no son necesarias en versiones recientes de Mongoose
      // useUnifiedTopology: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log('MongoDB: New connection established');
      return mongooseInstance;
    }).catch(error => {
        console.error('MongoDB: Connection error:', error);
        cached.promise = null; // Resetea la promesa en caso de error para permitir reintentos
        throw error; // Relanza el error para que sea manejado por quien llama
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Resetea la promesa en caso de error
    throw e;
  }
  
  return cached.conn;
}

export default dbConnect;

// Función para verificar el estado de la conexión (opcional, para depuración)
export async function getMongoConnectionState(): Promise<ConnectionStates> {
    if (!mongoose.connection) {
        return mongoose.ConnectionStates.disconnected;
    }
    return mongoose.connection.readyState;
}
