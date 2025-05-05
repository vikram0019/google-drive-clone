import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFile extends Document {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  userId: mongoose.Types.ObjectId;
  folderId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>({
  name: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  folderId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
}, {
  timestamps: true,
});

// Check if the model exists before creating a new one
export const File: Model<IFile> = mongoose.models.File || mongoose.model<IFile>('File', fileSchema);