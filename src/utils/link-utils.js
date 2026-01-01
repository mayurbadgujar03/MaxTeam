import { getLinkPreview } from "link-preview-js";

export async function fetchLinkMetadata(url) {
  try {
    const data = await getLinkPreview(url, {
      headers: {
        "User-Agent": "googlebot",
      },
      timeout: 8000,
    });

    if (
      !data ||
      (!data.title &&
        !data.siteName &&
        !data.description &&
        (!Array.isArray(data.images) || data.images.length === 0))
    ) {
      return { url };
    }

    return {
      url,
      title: data.title,
      siteName: data.siteName,
      description: data.description,
      image:
        Array.isArray(data.images) && data.images.length > 0
          ? data.images[0]
          : undefined,
    };
  } catch (err) {
    return { url };
  }
}
