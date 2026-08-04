import { getBucket, hasBucketBinding } from "../../../storage";
import { getStore } from "@netlify/blobs";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const maxFileSize = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const orderCode = String(formData.get("orderCode") ?? "").trim();

  if (!(file instanceof File) || !/^BB-\d{6,}$/.test(orderCode)) {
    return Response.json(
      { error: "Selecione uma imagem válida." },
      { status: 400 },
    );
  }

  const extension = allowedTypes.get(file.type);
  if (!extension || file.size <= 0 || file.size > maxFileSize) {
    return Response.json(
      { error: "Envie uma imagem JPG, PNG ou WEBP de até 8 MB." },
      { status: 400 },
    );
  }

  const key = `inspiracoes/${orderCode}/${crypto.randomUUID()}.${extension}`;

  if (hasBucketBinding()) {
    await getBucket().put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        orderCode,
        originalName: file.name.slice(0, 180),
      },
    });
  } else {
    const uploads = getStore("inspiration-uploads");
    await uploads.set(key, file, {
      metadata: {
        contentType: file.type,
        orderCode,
        originalName: file.name.slice(0, 180),
      },
      onlyIfNew: true,
    });
  }

  return Response.json({ key }, { status: 201 });
}
