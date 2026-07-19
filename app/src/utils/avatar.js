export const getPremiumAvatarUrl = (url, name = "User") => {
  if (!url || url.includes("placehold.co") || url.trim() === "") {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff&bold=true&size=128`;
  }
  return url;
};
