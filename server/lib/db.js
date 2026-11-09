import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

//function to connect with mongodb
export const connectDB = async () =>{
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if(!uri){
      throw new Error('Set MONGODB_URI in server/.env before starting the backend.');
    }

    mongoose.connection.on('connected', ()=> console.log('Database Connected'));
    mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
    mongoose.connection.on('disconnected', () => console.warn('Mongoose disconnected'));

    // Connect with modern options
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log('MongoDB connection established');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message || error);
    throw error;
  }
}
