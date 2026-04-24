import type { ASTNode } from "@/lib/parserTypes";

interface ASTViewerProps {
  ast: ASTNode | null;
  error: string | null;
}

const nodeTypeColor = (type: string): string => {
  switch (type) {
    case "Program": return "text-primary font-semibold";
    case "Declaration": return "text-primary font-semibold";
    case "Assignment": return "text-primary font-semibold";
    case "Expression": return "text-muted-foreground";
    case "BinaryOp": return "text-orange-600 font-medium";
    case "Identifier": return "text-accent-foreground";
    case "Number": return "text-success";
    default: return "";
  }
};

const TreeNode = ({ node, depth = 0 }: { node: ASTNode; depth?: number }) => {
  return (
    <div className="font-mono text-sm">
      <div
        className="flex items-center gap-2 py-0.5 px-2 rounded hover:bg-muted/40"
        style={{ marginLeft: depth * 16 }}
      >
        <span className="text-muted-foreground">└─</span>
        <span className={nodeTypeColor(node.type)}>{node.type}</span>
        {node.value !== undefined && (
          <span className="text-muted-foreground">
            : <span className="text-foreground">{node.value}</span>
          </span>
        )}
      </div>
      {node.children?.map((child, i) => (
        <TreeNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

export const ASTViewer = ({ ast, error }: ASTViewerProps) => {
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="px-5 py-3 border-b bg-muted/50 rounded-t-lg flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Abstract Syntax Tree (AST)
        </span>
        {error && (
          <span className="text-xs text-destructive font-medium">Parse failed</span>
        )}
      </div>
      <div className="max-h-96 overflow-auto p-4">
        {error ? (
          <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-sm text-destructive font-mono">
            {error}
          </div>
        ) : ast ? (
          <TreeNode node={ast} />
        ) : (
          <p className="text-sm text-muted-foreground italic">No AST generated.</p>
        )}
      </div>
    </div>
  );
};

export default ASTViewer;
