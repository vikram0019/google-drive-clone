import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectToDatabase } from '@/lib/mongoose';
import { Folder } from '@/models/folder';
import { ensureDirectoryExists } from '@/lib/server-utils';
import fs from 'fs';
import path from 'path';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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
    const parentId = searchParams.get('parentId') || null;
    
    await connectToDatabase();
    
    const folders = await Folder.find({
      userId: session.user.id,
      parentId: parentId ? parentId : null
    }).sort({ name: 1 });
    
    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
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
    
    const { name, parentId } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { message: 'Folder name is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Check if folder with same name exists in the same parent folder
    const existingFolder = await Folder.findOne({
      name,
      userId: session.user.id,
      parentId: parentId || null
    });
    
    if (existingFolder) {
      return NextResponse.json(
        { message: 'A folder with this name already exists' },
        { status: 409 }
      );
    }
    
    let folderPath = '';
    
    if (parentId) {
      // Find parent folder to get its path
      const parentFolder = await Folder.findOne({
        _id: parentId,
        userId: session.user.id
      });
      
      if (!parentFolder) {
        return NextResponse.json(
          { message: 'Parent folder not found' },
          { status: 404 }
        );
      }
      
      folderPath = `${parentFolder.path}/${name}`;
    } else {
      folderPath = `/${name}`;
    }
    
    // Create folder in database
    const folder = new Folder({
      name,
      userId: session.user.id,
      parentId: parentId || null,
      path: folderPath
    });
    console.log(folder,"folder");
    await folder.save();
    
    // Create folder in filesystem
    const userStoragePath = path.join(process.cwd(), 'public', 'uploads', session.user.id);
    const folderStoragePath = path.join(userStoragePath, folderPath);
    ensureDirectoryExists(folderStoragePath);
    
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}