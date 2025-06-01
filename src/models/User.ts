    // models/User.ts (o donde tengas tu esquema de usuario)
    import mongoose, { Schema, Document } from 'mongoose';

    // Define una interfaz para tu documento de usuario si usas TypeScript
    export interface IUser extends Document {
      email: string;
      name?: string;
      puntos?: number;
      preguntas_contestadas?: any[]; // Define un tipo más específico si es posible
      // ... otros campos que tengas ...
      password?: string | null;
      age?: number | null;
      provider?: string;
      createdAt?: Date;
    }

    const userSchema = new Schema<IUser>({
      email: { type: String, required: true, unique: true },
      name: { type: String },
      puntos: { type: Number, default: 0 },
      preguntas_contestadas: { type: Array, default: [] },
      // Asegúrate de que estos campos también estén si los usas en el callback de signIn
      password: { type: String, default: null },
      age: { type: Number, default: null },
      provider: { type: String },
      createdAt: { type: Date, default: Date.now },
    }, {
      collection: 'usuarios', // <--- ¡AQUÍ ESPECIFICAS EL NOMBRE DE LA COLECCIÓN!
      timestamps: true // Opcional: añade createdAt y updatedAt automáticamente
    });

    // Evita recompilar el modelo si ya existe (importante para Next.js en desarrollo)
    export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
    