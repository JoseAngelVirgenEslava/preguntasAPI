import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  puntos?: number;
  preguntas_contestadas?: any[];
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
  password: { type: String, default: null },
  age: { type: Number, default: null },
  provider: { type: String },
  createdAt: { type: Date, default: Date.now },
}, {
  collection: 'usuarios',
  timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
