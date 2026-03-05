const MCVIEW3D_EMBED_BASE =
  process.env.NEXT_PUBLIC_MCVIEW3D_EMBED_BASE ??
  "https://kurojs.github.io/McView3D/embed.html";

export function PlayerSkin({ username }: { username: string }) {
  const src = `${MCVIEW3D_EMBED_BASE}?skin=${encodeURIComponent(username)}&width=400&height=400&animation=idle&cape=default`;
  return (
    <iframe
      src={src}
      width={400}
      height={400}
      title={`${username} skin`}
      className="w-full max-w-[400px] rounded-lg border-0"
    />
  );
}
