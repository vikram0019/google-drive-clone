import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectToDatabase } from '@/lib/mongoose';
import { Folder } from '@/models/folder';
import { File } from '@/models/file';
import fs from 'fs';
import path from 'path';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const folderId = params.id;
    
    await connectToDatabase();
    
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
    
    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const folderId = params.id;
    const { name } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { message: 'Folder name is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
   
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
    
    // Check if another folder with the same name exists in the same parent
    const existingFolder = await Folder.findOne({
      name,
      userId: session.user.id,
      parentId: folder.parentId,
      _id: { $ne: folderId }
    });
    
    if (existingFolder) {
      return NextResponse.json(
        { message: 'A folder with this name already exists' },
        { status: 409 }
      );
    }
    
    // Update folder path and all subfolders' paths
    const oldPath = folder.path;
    const newPath = oldPath.replace(new RegExp(`/${folder.name}(?:/|$)`), `/${name}/`);
    
    // Update folder in database
    folder.name = name;
    folder.path = newPath;
    await folder.save();
    
    // Update subfolders paths
    const subfolders = await Folder.find({
      userId: session.user.id,
      path: { $regex: `^${oldPath}/` }
    });
    
    for (const subfolder of subfolders) {
      subfolder.path = subfolder.path.replace(oldPath, newPath);
      await subfolder.save();
    }
    
    // Rename folder in filesystem
    const userStoragePath = path.join(process.cwd(), 'public', 'uploads', session.user.id);
    const oldFolderPath = path.join(userStoragePath, oldPath);
    const newFolderPath = path.join(userStoragePath, newPath);
    
    if (fs.existsSync(oldFolderPath)) {
      const parentDir = path.dirname(newFolderPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.renameSync(oldFolderPath, newFolderPath);
    }
    
    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const folderId = params.id;
    
    await connectToDatabase();
    
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
    
    // Find all subfolders
    const subfolders = await Folder.find({
      userId: session.user.id,
      path: { $regex: `^${folder.path}/` }
    });
    
    const allFolderIds = [folderId, ...subfolders.map(sf => sf._id)];
    
    // Find all files in this folder and subfolders
    const files = await File.find({
      userId: session.user.id,
      folderId: { $in: allFolderIds }
    });
    
    // Delete files first
    for (const file of files) {
      const filePath = path.join(process.cwd(), file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await File.deleteOne({ _id: file._id });
    }
    
    // Delete subfolders
    await Folder.deleteMany({
      _id: { $in: subfolders.map(sf => sf._id) }
    });
    
    // Delete the main folder
    await Folder.deleteOne({ _id: folderId });
    
    // Delete folder from filesystem
    const folderPath = path.join(process.cwd(), 'public', 'uploads', session.user.id, folder.path);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
    
    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}