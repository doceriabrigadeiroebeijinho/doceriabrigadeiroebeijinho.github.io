import type { NextConfig } from "next";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// As fotos originais das decorações ficam em /assets/decoracoes no projeto.
// Copiá-las para /public torna seus URLs acessíveis tanto na galeria quanto na vitrine.
const photosSource = join(process.cwd(), "assets", "decoracoes");
const photosPublic = join(process.cwd(), "public", "assets", "decoracoes");
if (existsSync(photosSource)) {
  mkdirSync(photosPublic, { recursive: true });
  cpSync(photosSource, photosPublic, { recursive: true, force: true });
}

const nextConfig: NextConfig = {};

export default nextConfig;
