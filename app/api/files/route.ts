import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectToDatabase } from '@/lib/mongoose';
import { File } from '@/models/file';
import { Folder } from '@/models/folder';
import { generateUniqueFilename, ensureDirectoryExists } from '@/lib/server-utils';
import fs from 'fs';
import path from 'path';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId') || null;
    
    await connectToDatabase();
    
    const files = await File.find({
      userId: session.user.id,
      folderId: folderId ? folderId : null
    }).sort({ createdAt: -1 });
    
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string || null;
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File size exceeds the 10MB limit' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if folder exists (if folderId is provided)
    let folderPath = '';
    if (folderId) {
      const folder = await Folder.findOne({
        _id: folderId,
        userId: session.user.id
      });
      
      if (!folder) {
        return NextResponse.json(
          { message: 'Folder not found' },
          { status: 404 }
        );
      }
      
      folderPath = folder.path;
    }
    
    // Generate a unique filename to prevent collisions
    const uniqueFilename = generateUniqueFilename(file.name);
    
    // Create the storage directory if it doesn't exist
    const userStoragePath = path.join(process.cwd(), 'public', 'uploads', session.user.id);
    const storagePath = path.join(userStoragePath, folderPath);
    ensureDirectoryExists(storagePath);
    
    // Save the file to the filesystem
    const filePath = path.join(storagePath, uniqueFilename);
    const publicPath = `/uploads/${session.user.id}${folderPath}/${uniqueFilename}`;
    
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    
    // Save file metadata to the database
    const fileDoc = new File({
      name: uniqueFilename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: `public${publicPath}`,
      userId: session.user.id,
      folderId: folderId || null
    });
    
    await fileDoc.save();
    
    return NextResponse.json(fileDoc, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}