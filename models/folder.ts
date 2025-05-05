import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new Schema<IFolder>({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
  path: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Create a compound index to ensure uniqueness of folder names within the same parent folder for a user
folderSchema.index({ name: 1, userId: 1, parentId: 1 }, { unique: true });

// Check if the model exists before creating a new one
export const Folder: Model<IFolder> = mongoose.models.Folder || mongoose.model<IFolder>('Folder', folderSchema);