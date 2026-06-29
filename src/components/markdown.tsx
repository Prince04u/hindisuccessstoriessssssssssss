import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

export function Markdown({ children, linkPolicy = "nofollow" }: { children: string; linkPolicy?: "dofollow" | "nofollow" }) {
  return (
    <div className="prose-editorial">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          a: ({ href, children, ...rest }) => {
            const external = href?.startsWith("http");
            const rel = external ? (linkPolicy === "dofollow" ? "noopener" : "nofollow noopener ugc") : undefined;
            return <a href={href} rel={rel} target={external ? "_blank" : undefined} {...rest}>{children}</a>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
