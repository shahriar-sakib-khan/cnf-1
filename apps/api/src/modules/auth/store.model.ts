import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStore extends Document {
  ownerId: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
}, { timestamps: true });

export const StoreModel = mongoose.model<IStore>('Store', StoreSchema);
