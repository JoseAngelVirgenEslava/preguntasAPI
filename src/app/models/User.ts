import mongoose from "mongoose";

const preguntaSchema = new mongoose.Schema(
  {
    pregunta: String,
    respuesta_usuario: String,
    respuesta_correcta: String,
    categoria: String,
    correcta: Boolean,
    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  image: String,
  puntos: {
    type: Number,
    default: 0,
  },
  preguntas_contestadas: {
    type: [preguntaSchema],
    default: [],
  },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
