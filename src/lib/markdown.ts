import fs from 'fs';
import path from 'path';

export async function getProductDescription(id: string): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'descriptions', `${id}.md`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return null;
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Error reading description for ID ${id}:`, error);
    return null;
  }
}