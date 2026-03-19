import type { Request, Response } from "express";
import path from "path";
import fileDirName from "../utils/dirname";

const { __dirname } = fileDirName(import.meta.url)

export async function getHomePage(req: Request, res: Response) {
  try {
    const homeDir = path.join(__dirname, '..', '..', 'public', 'index.html');
    res.sendFile(homeDir);
  } catch (err: any) {
    res.status(500).json({ error: `Server error: ${err.message}` })
  }
}